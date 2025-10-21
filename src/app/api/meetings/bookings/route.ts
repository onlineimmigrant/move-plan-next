import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getOrganizationId } from '@/lib/supabase';
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// Helper function to create meeting room
async function createMeetingRoom(bookingId: string, maxParticipants: number = 2) {
  try {
    // Check if room already exists
    const { data: existingRoom } = await supabase
      .from('meeting_rooms')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (existingRoom) {
      console.log('Room already exists for booking:', bookingId);
      return existingRoom;
    }

    // Create unique room name
    const roomName = `meeting-${bookingId}-${Date.now()}`;

    // Create Twilio room
    const twilioRoom = await twilioClient.video.rooms.create({
      uniqueName: roomName,
      type: 'group',
      maxParticipants: maxParticipants,
      recordParticipantsOnConnect: false,
    });

    // Store room info in database
    const { data: room, error: insertError } = await supabase
      .from('meeting_rooms')
      .insert({
        booking_id: bookingId,
        twilio_room_sid: twilioRoom.sid,
        twilio_room_name: twilioRoom.uniqueName,
        status: 'active',
        max_participants: maxParticipants,
        record_participants_on_connect: false,
      })
      .select()
      .single();

    if (insertError) {
      // If database insert fails, try to complete the Twilio room
      try {
        await twilioClient.video.rooms(twilioRoom.sid).update({ status: 'completed' });
      } catch (cleanupError) {
        console.error('Failed to cleanup Twilio room:', cleanupError);
      }
      throw insertError;
    }

    return room;
  } catch (error) {
    console.error('Error creating meeting room:', error);
    throw error;
  }
}

// Validation schemas
const createBookingSchema = z.object({
  meeting_type_id: z.string().uuid(),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  scheduled_at: z.string().datetime(),
  timezone: z.string(),
  duration_minutes: z.number().min(15).max(480),
  host_user_id: z.string().uuid().optional(), // Optional for now, will set default
});

const updateBookingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().optional(),
});

// GET /api/meetings/bookings - List bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let organizationId = searchParams.get('organization_id');
    const hostUserId = searchParams.get('host_user_id');
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        console.error('Organization not found for baseUrl:', baseUrl);
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      console.log('Using fallback organization_id:', organizationId);
    }

    let query = supabase
      .from('bookings')
      .select(`
        *,
        meeting_type:meeting_types(*)
      `)
      .eq('organization_id', organizationId)
      .order('scheduled_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (hostUserId) {
      query = query.eq('host_user_id', hostUserId);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    return NextResponse.json({ bookings });

  } catch (error) {
    console.error('Error in GET /api/meetings/bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/meetings/bookings - Create booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createBookingSchema.parse(body);

    // Get organization ID from meeting type
    const { data: meetingType, error: meetingTypeError } = await supabase
      .from('meeting_types')
      .select('organization_id')
      .eq('id', validatedData.meeting_type_id)
      .single();

    if (meetingTypeError || !meetingType) {
      return NextResponse.json({ error: 'Invalid meeting type' }, { status: 400 });
    }

    // Check for scheduling conflicts
    const scheduledTime = new Date(validatedData.scheduled_at);
    const endTime = new Date(scheduledTime.getTime() + validatedData.duration_minutes * 60000);

    // Fetch all active bookings for the organization to check for overlaps
    const { data: existingBookings, error: conflictError } = await supabase
      .from('bookings')
      .select('id, title, scheduled_at, duration_minutes')
      .eq('organization_id', meetingType.organization_id)
      .not('status', 'in', '("cancelled","no_show")');

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError);
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
    }

    // Check for overlaps: Booking overlaps if new booking starts before existing ends AND new booking ends after existing starts
    const conflicts = existingBookings?.filter(booking => {
      const existingStart = new Date(booking.scheduled_at);
      const existingEnd = new Date(existingStart.getTime() + booking.duration_minutes * 60000);
      
      // Overlap condition: new start < existing end AND new end > existing start
      return scheduledTime < existingEnd && endTime > existingStart;
    }) || [];

    if (conflicts.length > 0) {
      console.log('Booking conflict detected:', {
        requestedSlot: { start: scheduledTime.toISOString(), end: endTime.toISOString() },
        conflicts: conflicts.map(c => ({
          id: c.id,
          title: c.title,
          start: c.scheduled_at,
          duration: c.duration_minutes
        }))
      });
      return NextResponse.json({
        error: 'Time slot is not available',
        conflicts
      }, { status: 409 });
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        ...validatedData,
        organization_id: meetingType.organization_id,
        host_user_id: validatedData.host_user_id || '00000000-0000-0000-0000-000000000001', // Default host for now
        status: 'scheduled',
      })
      .select(`
        *,
        meeting_type:meeting_types(*)
      `)
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // Automatically create meeting room for the booking
    try {
      const room = await createMeetingRoom(booking.id, 2); // Default to 2 participants
      console.log('Meeting room created successfully:', room.id);
    } catch (roomError) {
      console.error('Error creating meeting room:', roomError);
      // Don't fail the booking creation if room creation fails
      // The room can be created later when needed
    }

    // TODO: Send confirmation email
    // TODO: Create calendar event

    return NextResponse.json({ booking }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Error in POST /api/meetings/bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}