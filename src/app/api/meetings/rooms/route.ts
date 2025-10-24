import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { z } from 'zod';

export const runtime = 'nodejs'; // Force nodejs runtime

console.log('API Route runtime check:', {
  NEXT_RUNTIME: process.env.NEXT_RUNTIME,
  runtime: 'nodejs',
  isNode: typeof process !== 'undefined' && process.versions && process.versions.node,
  nodeVersion: process.versions?.node
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const createRoomSchema = z.object({
  booking_id: z.string().uuid(),
  max_participants: z.number().min(2).max(50).default(2),
});

const joinRoomSchema = z.object({
  booking_id: z.string().uuid(),
  identity: z.string().min(1), // Participant name/email
});

// POST /api/meetings/rooms - Create Twilio room for booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    console.log('POST /api/meetings/rooms - Creating room for:', validatedData);

    // Check if booking exists and is active
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, title, status, scheduled_at, duration_minutes')
      .eq('id', validatedData.booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot create room for cancelled booking' }, { status: 400 });
    }

    // Check if room already exists and is active - use REST API to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const existingRoomResponse = await fetch(`${supabaseUrl}/rest/v1/meeting_rooms?booking_id=eq.${validatedData.booking_id}&status=eq.active&select=*&order=created_at.desc&limit=1`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });

    const existingRooms = await existingRoomResponse.json();

    if (existingRooms && existingRooms.length > 0) {
      // Return the most recent active room
      return NextResponse.json({
        room: existingRooms[0],
        message: 'Using existing active room'
      });
    }

    // No active room found, try to create a new one
    // Create unique room name (shorter)
    const roomName = `meeting-${validatedData.booking_id.slice(-8)}-${Date.now()}`;

    try {
      // Create Twilio room using v1 API
      const twilioRoom = await twilioClient.video.v1.rooms.create({
        uniqueName: roomName
      });

      // Store room info in database
      const { data: room, error: insertError } = await supabase
        .from('meeting_rooms')
        .insert({
          booking_id: validatedData.booking_id,
          twilio_room_sid: twilioRoom.sid,
          twilio_room_name: twilioRoom.uniqueName,
          status: 'active',
          max_participants: validatedData.max_participants,
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

      return NextResponse.json({ room }, { status: 201 });

    } catch (twilioError: any) {
      console.error('Twilio room creation error:', twilioError);

      // Handle specific Twilio errors
      if (twilioError.code === 20503 || twilioError.status === 503) {
        // Service unavailable - try to find any existing room
        const fallbackResponse = await fetch(`${supabaseUrl}/rest/v1/meeting_rooms?booking_id=eq.${validatedData.booking_id}&select=*&order=created_at.desc&limit=1`, {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
        });

        const fallbackRooms = await fallbackResponse.json();

        if (fallbackRooms && fallbackRooms.length > 0) {
          return NextResponse.json({
            room: fallbackRooms[0],
            message: 'Using existing room due to service limitations',
            warning: 'Twilio service temporarily unavailable, using existing room'
          });
        }

        return NextResponse.json({
          error: 'Video service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
          message: 'Unable to create new room. Please try joining an existing meeting or contact support.'
        }, { status: 503 });
      }

      if (twilioError.code === 53113) {
        return NextResponse.json({
          error: 'Room name already exists',
          code: 'ROOM_NAME_EXISTS'
        }, { status: 409 });
      }

      return NextResponse.json({
        error: 'Failed to create video room',
        details: twilioError.message
      }, { status: 500 });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Error in POST /api/meetings/rooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/meetings/rooms/join - Generate access token for joining room
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = joinRoomSchema.parse(body);

    // Get room info - get the active room for this booking
    // Try using REST API directly to bypass client RLS issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const response = await fetch(`${supabaseUrl}/rest/v1/meeting_rooms?booking_id=eq.${validatedData.booking_id}&status=eq.active&select=*&order=created_at.desc&limit=1`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });

    const rooms = await response.json();

    if (!response.ok || !rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'Meeting room not found' }, { status: 404 });
    }

    const room = rooms[0]; // Take the most recent active room

    if (room.status !== 'active') {
      return NextResponse.json({
        error: 'Meeting room is not active',
        status: room.status
      }, { status: 400 });
    }

    // Check if room exists on Twilio
    // Temporarily disabled due to service issues
    /*
    try {
      const twilioRoom = await twilioClient.video.rooms(room.twilio_room_sid).fetch();
      if (twilioRoom.status === 'completed') {
        return NextResponse.json({
          error: 'Meeting room has ended',
          status: twilioRoom.status
        }, { status: 400 });
      }
    } catch (twilioError: any) {
      console.error('Error fetching room from Twilio:', twilioError);
      return NextResponse.json({
        error: 'Room not found on Twilio',
        details: twilioError.message
      }, { status: 404 });
    }
    */

    // Generate access token using API Keys (required for Twilio Video)
    const apiKeySid = process.env.TWILIO_API_KEY;
    const apiKeySecret = process.env.TWILIO_API_SECRET;

    if (!apiKeySid || !apiKeySecret) {
      console.error('❌ Missing TWILIO_API_KEY or TWILIO_API_SECRET environment variables');
      return NextResponse.json({
        error: 'Server configuration error: Missing API credentials',
        message: 'Please configure TWILIO_API_KEY and TWILIO_API_SECRET in environment variables',
        service_status: 'Check https://status.twilio.com for service availability'
      }, { status: 500 });
    }

    // Use the identity from the request (sent by frontend)
    const identity = validatedData.identity;

    console.log('🔑 Generating token with API Key:', apiKeySid.substring(0, 10) + '...');
    console.log('📍 Room:', room.twilio_room_name);
    console.log('👤 Identity (from request):', identity);
    console.log('🔐 Account SID:', process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...');
    
    console.log('Creating AccessToken with:', {
      accountSid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...',
      apiKeySid: apiKeySid.substring(0, 10) + '...',
      apiKeySecretLength: apiKeySecret.length,
      identity: identity
    });

    const accessToken = new twilio.jwt.AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      apiKeySid,
      apiKeySecret,
      {
        identity: identity,
        ttl: 3600 // 1 hour
      }
    );

    console.log('✅ AccessToken created successfully');

    // Add video grant with room name
    const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
      room: room.twilio_room_name, // Use name instead of SID
    });
    accessToken.addGrant(videoGrant);

    // Generate JWT token
    const jwtToken = accessToken.toJwt();
    
    console.log('📝 Generated JWT token (first 50 chars):', jwtToken.substring(0, 50) + '...');
    console.log('🔍 Token structure check:', {
      tokenLength: jwtToken.length,
      hasDots: (jwtToken.match(/\./g) || []).length,
      startsCorrectly: jwtToken.startsWith('eyJ')
    });    // Update room started_at if this is the first participant
    const now = new Date().toISOString();
    await supabase
      .from('meeting_rooms')
      .update({
        started_at: room.started_at || now,
        updated_at: now
      })
      .eq('id', room.id);

    // Add participant to meeting_participants table
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, host_user_id, customer_id, customer_email, customer_name')
      .eq('id', validatedData.booking_id)
      .single();

    if (booking) {
      await supabase
        .from('meeting_participants')
        .insert({
          booking_id: validatedData.booking_id,
          email: validatedData.identity.includes('@') ? validatedData.identity : undefined,
          name: validatedData.identity,
          role: booking.host_user_id === validatedData.identity ? 'host' : 'attendee',
          joined_at: now,
        });
    }

    return NextResponse.json({
      token: jwtToken,
      room_name: room.twilio_room_name,
      room_sid: room.twilio_room_sid,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Error in PUT /api/meetings/rooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}