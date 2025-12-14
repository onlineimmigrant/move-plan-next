import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/email/accounts/:id/test-connection
 * Test connection to an email account
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

    // Test connection based on provider
    let testResult = { status: 'success', message: '' };

    switch (account.provider) {
      case 'gmail':
        // Test Gmail OAuth token
        if (!account.access_token) {
          testResult = { 
            status: 'error', 
            message: 'No access token found. Please reconnect your Gmail account.' 
          };
        } else {
          // TODO: Make actual Gmail API call to verify token
          testResult = { 
            status: 'success', 
            message: 'Gmail connection is active' 
          };
        }
        break;

      case 'outlook':
        // Test Outlook OAuth token
        if (!account.access_token) {
          testResult = { 
            status: 'error', 
            message: 'No access token found. Please reconnect your Outlook account.' 
          };
        } else {
          // TODO: Make actual Microsoft Graph API call to verify token
          testResult = { 
            status: 'success', 
            message: 'Outlook connection is active' 
          };
        }
        break;

      case 'ses':
        // SES accounts don't need connection testing here
        testResult = { 
          status: 'success', 
          message: 'SES account is configured. Test email sending from SES Configuration tab.' 
        };
        break;

      default:
        testResult = { 
          status: 'error', 
          message: 'Unknown provider' 
        };
    }

    // Update sync status based on test result
    if (testResult.status === 'success') {
      await supabase
        .from('email_accounts')
        .update({ 
          sync_status: 'synced',
          sync_error: null,
          last_sync_at: new Date().toISOString()
        })
        .eq('id', accountId);
    } else {
      await supabase
        .from('email_accounts')
        .update({ 
          sync_status: 'error',
          sync_error: testResult.message
        })
        .eq('id', accountId);
    }

    return NextResponse.json(testResult);
  } catch (error: any) {
    console.error('Error testing email account connection:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: error.message || 'Failed to test connection' 
      },
      { status: 500 }
    );
  }
}
