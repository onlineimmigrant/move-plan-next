import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * DELETE /api/email/accounts/:id
 * Disconnect an email account
 */
export async function DELETE(
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

    // Don't allow deleting primary account if other accounts exist
    if (account.is_primary) {
      const { count } = await supabase
        .from('email_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .neq('id', accountId);

      if (count && count > 0) {
        return NextResponse.json(
          { error: 'Cannot delete primary account. Set another account as primary first.' },
          { status: 400 }
        );
      }
    }

    // Delete account
    const { error: deleteError } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', accountId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ 
      success: true, 
      message: 'Email account disconnected successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting email account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete email account' },
      { status: 500 }
    );
  }
}
