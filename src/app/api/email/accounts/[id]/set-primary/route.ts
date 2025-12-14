import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/email/accounts/:id/set-primary
 * Set an email account as primary
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const accountId = params.id;

    // Verify account belongs to organization
    const { data: account, error: fetchError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('organization_id', profile.organization_id)
      .single();

    if (fetchError || !account) {
      return NextResponse.json(
        { error: 'Email account not found' },
        { status: 404 }
      );
    }

    // Set all accounts to non-primary
    await supabase
      .from('email_accounts')
      .update({ is_primary: false })
      .eq('organization_id', profile.organization_id);

    // Set this account as primary
    const { error: updateError } = await supabase
      .from('email_accounts')
      .update({ is_primary: true })
      .eq('id', accountId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      message: 'Primary account updated successfully' 
    });
  } catch (error: any) {
    console.error('Error setting primary account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set primary account' },
      { status: 500 }
    );
  }
}
