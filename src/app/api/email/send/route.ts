import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SendEmailRequest {
  organization_id: string;
  from_email: string;
  from_name?: string;
  recipients: string[];
  subject: string;
  body: string;
  reply_to?: string;
  cc?: string[];
  bcc?: string[];
  sent_log_ids?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - No auth token' }, { status: 401 });
    }

    // Create authenticated Supabase client with the auth token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );
    
    // Verify the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const body: SendEmailRequest = await request.json();
    const { 
      organization_id, 
      from_email,
      from_name,
      recipients, 
      subject, 
      body: emailBody, 
      reply_to,
      cc = [],
      bcc = [],
      sent_log_ids = []
    } = body;

    // Validate required fields
    if (!organization_id || !from_email || !recipients?.length || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch AWS SES configuration
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('ses_access_key_id, ses_secret_access_key, ses_region, transactional_email')
      .eq('organization_id', organization_id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'AWS SES not configured. Please configure in Settings.' },
        { status: 400 }
      );
    }

    if (!settings.ses_access_key_id || !settings.ses_secret_access_key) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
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

    const sourceEmail = from_name 
      ? `${from_name} <${from_email}>`
      : from_email;

    const results: { success: boolean; recipient: string; messageId?: string; error?: string }[] = [];

    // Send email to each recipient
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const logId = sent_log_ids[i];

      try {
        const sendCommand = new SendEmailCommand({
          Source: sourceEmail,
          Destination: {
            ToAddresses: [recipient],
            CcAddresses: cc.length > 0 ? cc : undefined,
            BccAddresses: bcc.length > 0 ? bcc : undefined,
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: emailBody,
                Charset: 'UTF-8',
              },
            },
          },
          ReplyToAddresses: reply_to ? [reply_to] : undefined,
        });

        const response = await sesClient.send(sendCommand);

        // Update email_sent_log with success
        await supabaseAdmin
          .from('email_sent_log')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            ses_message_id: response.MessageId,
          })
          .eq('id', logId);

        results.push({
          success: true,
          recipient,
          messageId: response.MessageId,
        });
      } catch (error: any) {
        console.error(`Failed to send email to ${recipient}:`, error);

        // Update email_sent_log with failure
        await supabaseAdmin
          .from('email_sent_log')
          .update({
            status: 'failed',
            // Note: error_message column doesn't exist in current schema
            // Using status 'failed' to indicate failure
          })
          .eq('id', logId);

        results.push({
          success: false,
          recipient,
          error: error.message || 'Failed to send email',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} email(s), ${failedCount} failed`,
      results,
    });
  } catch (error: any) {
    console.error('Error in send email API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
