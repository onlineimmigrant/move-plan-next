import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/email/accounts
 * List all connected email accounts for the organization
 */
export async function GET(request: NextRequest) {
  try {

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch email accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (accountsError) throw accountsError;

    return NextResponse.json({ accounts: accounts || [] });
  } catch (error: any) {
    console.error('Error fetching email accounts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email accounts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/accounts
 * Manually add an email account (for SES accounts)
 */
export async function POST(request: NextRequest) {
  try {

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { provider, email_address, display_name } = body;

    // Validation
    if (!provider || !email_address) {
      return NextResponse.json(
        { error: 'Provider and email address are required' },
        { status: 400 }
      );
    }

    if (!['gmail', 'outlook', 'ses'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be gmail, outlook, or ses' },
        { status: 400 }
      );
    }

    // Check if account already exists
    const { data: existing } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .eq('email_address', email_address)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This email account is already connected' },
        { status: 409 }
      );
    }

    // Check if this is the first account
    const { count } = await supabase
      .from('email_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id);

    const isPrimary = count === 0;

    // Create email account
    const { data: account, error: insertError } = await supabase
      .from('email_accounts')
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        provider,
        email_address,
        display_name: display_name || email_address,
        is_primary: isPrimary,
        is_active: true,
        sync_status: provider === 'ses' ? 'synced' : 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ 
      success: true, 
      account 
    });
  } catch (error: any) {
    console.error('Error creating email account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create email account' },
      { status: 500 }
    );
  }
}
