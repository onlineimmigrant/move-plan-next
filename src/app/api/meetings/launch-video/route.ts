import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import AccessToken from 'twilio/lib/jwt/AccessToken';
const VideoGrant = AccessToken.VideoGrant;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Twilio credentials
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;

function generateTwilioToken(identity: string, roomName: string): string {
  // Validate Twilio credentials exist
  if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET) {
    console.error('[launch-video] Missing Twilio credentials:', {
      hasSid: !!TWILIO_ACCOUNT_SID,
      hasKey: !!TWILIO_API_KEY,
      hasSecret: !!TWILIO_API_SECRET
    });
    throw new Error('Twilio credentials not configured');
  }

  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
    { identity, ttl: 3600 } // 1 hour TTL
  );

  const videoGrant = new VideoGrant({ room: roomName });
  token.addGrant(videoGrant);

  return token.toJwt();
}

export async function POST(request: NextRequest) {
  try {
    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { booking_id, update_status = true } = body;

    if (!booking_id) {
      return NextResponse.json(
        { success: false, error: 'booking_id is required' },
        { status: 400 }
      );
    }

    // Fetch booking with meeting type details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        meeting_type:meeting_types(*)
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this booking
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id, email')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
    const isHost = booking.host_user_id === user.id;
    const isCustomer = booking.customer_id === user.id || booking.customer_email === profile?.email || booking.customer_email === user.email;

    console.log('[launch-video] User access check:', {
      userId: user.id,
      userEmail: user.email,
      profileEmail: profile?.email,
      isAdmin,
      isHost,
      isCustomer,
      bookingHostId: booking.host_user_id,
      bookingCustomerEmail: booking.customer_email,
      bookingCustomerId: booking.customer_id
    });

    if (!isAdmin && !isHost && !isCustomer) {
      console.error('[launch-video] Access denied - user is not admin, host, or customer');
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if meeting can be joined
    const now = new Date();
    const startTime = new Date(booking.scheduled_at);
    const endTime = new Date(startTime.getTime() + booking.duration_minutes * 60000);
    const fifteenMinsBefore = new Date(startTime.getTime() - 15 * 60 * 1000);

    // Admins and hosts can join anytime before end
    // Customers can join if:
    // 1. Within 15 minutes before start time, OR
    // 2. Meeting is already in progress (allows rejoining)
    const isMeetingInProgress = booking.status === 'in_progress';
    const isWithinJoinWindow = now >= fifteenMinsBefore && now < endTime;
    const canJoin = isAdmin || isHost || isMeetingInProgress || isWithinJoinWindow;

    if (!canJoin) {
      console.log('[launch-video] Cannot join:', {
        isAdmin,
        isHost,
        isMeetingInProgress,
        isWithinJoinWindow,
        now: now.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
      return NextResponse.json(
        { success: false, error: 'Meeting cannot be joined at this time' },
        { status: 403 }
      );
    }

    console.log('[launch-video] Join allowed:', {
      isAdmin,
      isHost,
      isMeetingInProgress,
      isWithinJoinWindow
    });

    // Generate room name (use booking ID for consistency)
    const roomName = `meeting-${booking_id}`;

    // Get user's display name
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const identity = userProfile?.full_name || userProfile?.email || user.id;

    // Generate Twilio token
    console.log('[launch-video] Generating token for:', { identity, roomName, booking_id });
    const twilioToken = generateTwilioToken(identity, roomName);
    console.log('[launch-video] Token generated successfully');

    // Update booking status if requested and user is host/admin starting the meeting
    if (update_status && (isAdmin || isHost)) {
      // Only change to in_progress if booking is in waiting status (customer already joined waiting room)
      // If status is confirmed/scheduled, keep it that way so customer can join waiting room
      if (booking.status === 'waiting') {
        console.log('[launch-video] Host/Admin approving from waiting room, updating status to in_progress');
        await supabase
          .from('bookings')
          .update({ 
            status: 'in_progress',
            metadata: {
              ...booking.metadata,
              video_started_at: new Date().toISOString(),
              started_by: user.id
            }
          })
          .eq('id', booking_id);

        booking.status = 'in_progress';
      } else {
        console.log('[launch-video] Host/Admin joined, but not changing status yet (waiting for customer to join waiting room)');
      }
    }

    return NextResponse.json({
      success: true,
      booking,
      token: twilioToken, // Changed from twilio_token to match frontend expectation
      twilio_token: twilioToken, // Keep for backwards compatibility
      room_name: roomName,
      identity,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
    });

  } catch (error) {
    console.error('[launch-video] Error launching video call:', error);
    if (error instanceof Error) {
      console.error('[launch-video] Error message:', error.message);
      console.error('[launch-video] Error stack:', error.stack);
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
