import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/email/oauth/gmail/init
 * Initialize Gmail OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Google OAuth is configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'https://codedharmony.app';
    const redirectUri = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/api/email/oauth/gmail/callback'
      : `${mainDomain}/api/email/oauth/gmail/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable.' },
        { status: 500 }
      );
    }

    // Get current tenant URL from request
    const tenantUrl = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    // Encode state with user ID and tenant URL for redirect after OAuth
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      tenantUrl,
    })).toString('base64');

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Error initializing Gmail OAuth:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize Gmail OAuth' },
      { status: 500 }
    );
  }
}
