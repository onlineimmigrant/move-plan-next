import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Twilio credentials
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_API_KEY = process.env.TWILIO_API_KEY!;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, identity } = body;

    if (!roomName || !identity) {
      return NextResponse.json(
        { error: 'roomName and identity are required' },
        { status: 400 }
      );
    }

    // Validate Twilio credentials
    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET) {
      console.error('Missing Twilio credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('[video-token] Generating token:', {
      roomName,
      identity,
      accountSid: TWILIO_ACCOUNT_SID.substring(0, 10) + '...',
    });

    // Create access token
    const accessToken = new twilio.jwt.AccessToken(
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY,
      TWILIO_API_SECRET,
      {
        identity: identity,
        ttl: 3600 // 1 hour
      }
    );

    // Add video grant
    const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
      room: roomName,
    });
    accessToken.addGrant(videoGrant);

    // Generate JWT token
    const token = accessToken.toJwt();

    console.log('[video-token] Token generated successfully');

    return NextResponse.json({
      token,
      roomName,
      identity,
    });

  } catch (error) {
    console.error('[video-token] Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
