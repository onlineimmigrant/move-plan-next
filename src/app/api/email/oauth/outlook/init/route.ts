import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/email/oauth/outlook/init
 * Initialize Outlook OAuth flow
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

    // Check if Microsoft OAuth is configured
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'https://codedharmony.app';
    const redirectUri = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/api/email/oauth/outlook/callback'
      : `${mainDomain}/api/email/oauth/outlook/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Microsoft OAuth not configured. Please set MICROSOFT_CLIENT_ID environment variable.' },
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
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: [
        'offline_access',
        'Mail.Read',
        'Mail.Send',
        'Mail.ReadWrite',
        'User.Read',
      ].join(' '),
      state,
    });

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('Error initializing Outlook OAuth:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize Outlook OAuth' },
      { status: 500 }
    );
  }
}
