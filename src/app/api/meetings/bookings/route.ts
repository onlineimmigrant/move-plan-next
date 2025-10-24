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
  status: z.enum(['scheduled', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().optional(),
});

// GET /api/meetings/bookings - List bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let organizationId = searchParams.get('organization_id');
    const hostUserId = searchParams.get('host_user_id');
    const customerId = searchParams.get('customer_id');
    const customerEmail = searchParams.get('customer_email');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        console.error('Organization not found for baseUrl:', baseUrl);
        return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
      }
      console.log('Using fallback organization_id:', organizationId);
    }

    // First, get bookings with meeting types
    let query = supabase
      .from('bookings')
      .select(`
        *,
        meeting_type:meeting_types(*)
      `)
      .eq('organization_id', organizationId)
      .order('scheduled_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (hostUserId) {
      query = query.eq('host_user_id', hostUserId);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (customerEmail) {
      query = query.eq('customer_email', customerEmail);
    }

    if (status) {
      // Support multiple statuses separated by comma
      const statuses = status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0]);
      } else {
        query = query.in('status', statuses);
      }
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Enrich bookings with host profile data
    if (bookings && bookings.length > 0) {
      const hostIds = [...new Set(bookings.map(b => b.host_user_id).filter(Boolean))];
      
      if (hostIds.length > 0) {
        const { data: hosts } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', hostIds);

        if (hosts) {
          const hostMap = new Map(hosts.map(h => [h.id, h]));
          bookings.forEach(booking => {
            if (booking.host_user_id) {
              booking.host = hostMap.get(booking.host_user_id);
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true, bookings: bookings || [] });

  } catch (error) {
    console.error('Error in GET /api/meetings/bookings:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
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

    // Send confirmation email to customer
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('domain, site')
        .eq('organization_id', meetingType.organization_id)
        .single();

      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', booking.host_user_id)
        .single();

      if (settings) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        if (!baseUrl) {
          console.error('NEXT_PUBLIC_BASE_URL is not defined');
        } else {
          const isDevelopment = process.env.NODE_ENV === 'development' || baseUrl.includes('localhost');
          const customerFacingUrl = isDevelopment 
            ? baseUrl
            : `https://${settings.domain}`;
          
          const meetingLink = `${customerFacingUrl}/account?openMeeting=${booking.id}`;
          
          // Format meeting time in the booking's timezone
          const scheduledDate = new Date(booking.scheduled_at);
          const meetingTime = scheduledDate.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short',
            timeZone: booking.timezone || 'UTC'
          });

          console.log('[bookings] Sending booking confirmation email:', {
            to: validatedData.customer_email,
            bookingId: booking.id,
            meetingLink,
            meetingTime,
            organizationId: meetingType.organization_id,
          });

          const emailPayload = {
            type: 'meeting_invitation',
            to: validatedData.customer_email,
            organization_id: meetingType.organization_id,
            name: validatedData.customer_name,
            emailDomainRedirection: meetingLink,
            placeholders: {
              meeting_title: validatedData.title,
              host_name: hostProfile?.full_name || 'Your host',
              meeting_time: meetingTime,
              duration_minutes: validatedData.duration_minutes.toString(),
              meeting_notes: validatedData.description || '',
              meeting_notes_html: validatedData.description 
                ? `<div class="info-row"><span class="info-label">Notes:</span> ${validatedData.description}</div>` 
                : '',
            },
          };

          console.log('[bookings] Email payload:', JSON.stringify(emailPayload, null, 2));

          const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
          });

          console.log('[bookings] Email response status:', emailResponse.status);

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('[bookings] Failed to send confirmation email:', emailResponse.status, errorText);
          } else {
            const emailResult = await emailResponse.json();
            console.log('[bookings] Confirmation email sent successfully:', emailResult);
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({ booking }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Error in POST /api/meetings/bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}