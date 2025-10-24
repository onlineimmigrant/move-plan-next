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
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_API_KEY = process.env.TWILIO_API_KEY!;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET!;

function generateTwilioToken(identity: string, roomName: string): string {
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
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json(
        { success: false, error: 'booking_id is required' },
        { status: 400 }
      );
    }

    // Verify booking belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user has access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isHost = booking.host_user_id === user.id;
    const isCustomer = booking.customer_id === user.id || booking.customer_email === profile?.email || booking.customer_email === user.email;

    if (!isAdmin && !isHost && !isCustomer) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate room name
    const roomName = `meeting-${booking_id}`;

    // Get user's display name
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const identity = userProfile?.full_name || userProfile?.email || user.id;

    // Generate new Twilio token
    const twilioToken = generateTwilioToken(identity, roomName);

    return NextResponse.json({
      success: true,
      token: twilioToken,
      room_name: roomName,
      identity,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
    });

  } catch (error) {
    console.error('Error refreshing Twilio token:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
