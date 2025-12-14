import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/email/oauth/gmail/callback
 * Handle Gmail OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      // OAuth was denied or failed
      return new Response(
        '<html><body><script>window.close();</script><p>OAuth failed. You can close this window.</p></body></html>',
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !stateParam) {
      return new Response(
        '<html><body><script>window.close();</script><p>Invalid OAuth callback. You can close this window.</p></body></html>',
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Decode state to get user ID and tenant URL
    let userId: string;
    let tenantUrl: string;
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, 'base64').toString());
      userId = decoded.userId;
      tenantUrl = decoded.tenantUrl;
    } catch (err) {
      // Fallback for old state format (just user ID)
      userId = stateParam;
      tenantUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'https://codedharmony.app';
    const redirectUri = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/api/email/oauth/gmail/callback'
      : `${mainDomain}/api/email/oauth/gmail/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      throw new Error(`Failed to exchange authorization code for tokens: ${JSON.stringify(errorData)}`);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Get user email from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const userInfo = await userInfoResponse.json();
    const { email, name } = userInfo;

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Check if account already exists
    const { data: existing } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .eq('email_address', email)
      .single();

    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    if (existing) {
      // Update existing account with new tokens
      await supabase
        .from('email_accounts')
        .update({
          access_token,
          refresh_token: refresh_token || undefined,
          token_expires_at: tokenExpiresAt,
          sync_status: 'pending',
          is_active: true,
        })
        .eq('id', existing.id);
    } else {
      // Check if this is the first account
      const { count } = await supabase
        .from('email_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id);

      // Create new account
      await supabase
        .from('email_accounts')
        .insert({
          organization_id: profile.organization_id,
          user_id: userId,
          provider: 'gmail',
          email_address: email,
          display_name: name || email,
          access_token,
          refresh_token,
          token_expires_at: tokenExpiresAt,
          is_primary: count === 0,
          is_active: true,
          sync_status: 'pending',
        });
    }

    // Redirect to tenant domain with success parameter
    const tenantRedirect = `${tenantUrl}?gmail_connected=success`;
    return new Response(
      `<html><body><script>window.location.href='${tenantRedirect}';setTimeout(()=>window.close(),1000);</script><p>Gmail connected successfully! Redirecting...</p></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error: any) {
    console.error('Error in Gmail OAuth callback:', error);
    return new Response(
      `<html><body><script>window.close();</script><p>Error: ${error.message}</p></body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
