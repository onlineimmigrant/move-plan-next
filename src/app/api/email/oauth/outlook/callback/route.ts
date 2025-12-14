import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/email/oauth/outlook/callback
 * Handle Outlook OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // user ID
    const error = searchParams.get('error');

    if (error) {
      // OAuth was denied or failed
      return new Response(
        '<html><body><script>window.close();</script><p>OAuth failed. You can close this window.</p></body></html>',
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !state) {
      return new Response(
        '<html><body><script>window.close();</script><p>Invalid OAuth callback. You can close this window.</p></body></html>',
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Exchange code for tokens
    const clientId = process.env.MICROSOFT_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
    const redirectUri = process.env.NEXT_PUBLIC_URL 
      ? `${process.env.NEXT_PUBLIC_URL}/api/email/oauth/outlook/callback`
      : 'http://localhost:3000/api/email/oauth/outlook/callback';

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
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
      throw new Error('Failed to exchange authorization code for tokens');
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Get user email from Microsoft Graph
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info from Microsoft');
    }

    const userInfo = await userInfoResponse.json();
    const { mail, displayName } = userInfo;

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', state)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Check if account already exists
    const { data: existing } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .eq('email_address', mail)
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
          user_id: state,
          provider: 'outlook',
          email_address: mail,
          display_name: displayName || mail,
          access_token,
          refresh_token,
          token_expires_at: tokenExpiresAt,
          is_primary: count === 0,
          is_active: true,
          sync_status: 'pending',
        });
    }

    // Close popup window
    return new Response(
      '<html><body><script>window.close();</script><p>Outlook connected successfully! You can close this window.</p></body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error: any) {
    console.error('Error in Outlook OAuth callback:', error);
    return new Response(
      `<html><body><script>window.close();</script><p>Error: ${error.message}</p></body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
