import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SESClient, GetAccountSendingEnabledCommand } from '@aws-sdk/client-ses';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Fetch AWS SES configuration
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('ses_access_key_id, ses_secret_access_key, ses_region')
      .eq('organization_id', profile.organization_id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { success: false, message: 'AWS SES configuration not found' },
        { status: 400 }
      );
    }

    if (!settings.ses_access_key_id || !settings.ses_secret_access_key) {
      return NextResponse.json(
        { success: false, message: 'AWS credentials not configured' },
        { status: 400 }
      );
    }

    // Initialize AWS SES client
    const sesClient = new SESClient({
      region: settings.ses_region || 'us-east-1',
      credentials: {
        accessKeyId: settings.ses_access_key_id,
        secretAccessKey: settings.ses_secret_access_key,
      },
    });

    // Test connection
    const command = new GetAccountSendingEnabledCommand({});
    await sesClient.send(command);

    return NextResponse.json({
      success: true,
      message: 'AWS SES connection successful',
    });
  } catch (error: any) {
    console.error('AWS SES test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to connect to AWS SES' 
      },
      { status: 400 }
    );
  }
}
