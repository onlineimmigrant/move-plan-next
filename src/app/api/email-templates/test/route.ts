import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
  },
});

/**
 * POST /api/email-templates/test
 * Send a test email using a template
 * 
 * Body:
 * - template_id: ID of template to test
 * - test_email: Email address to send test to
 * - placeholders (optional): Custom placeholder values
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_id, test_email, placeholders = {} } = body;

    // Validation
    if (!template_id) {
      return NextResponse.json(
        { error: 'template_id is required' },
        { status: 400 }
      );
    }

    if (!test_email) {
      return NextResponse.json(
        { error: 'test_email is required' },
        { status: 400 }
      );
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(test_email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from('email_template')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Default test placeholder values
    const defaultPlaceholders = {
      user_name: 'Test User',
      user_email: test_email,
      user_phone: '+1 (555) 123-4567',
      company_name: 'Move Plan',
      support_email: 'support@moveplan.com',
      current_year: new Date().getFullYear().toString(),
      ticket_id: 'TEST-12345',
      ticket_subject: 'Test Support Ticket',
      ticket_status: 'Open',
      meeting_title: 'Test Meeting',
      meeting_date: new Date().toLocaleDateString(),
      meeting_time: '10:00 AM',
      meeting_link: 'https://meet.example.com/test-meeting',
      verification_link: 'https://example.com/verify?token=TEST_TOKEN',
      reset_link: 'https://example.com/reset-password?token=TEST_TOKEN',
      ...placeholders,
    };

    // Replace placeholders in content
    let htmlContent = template.html_body || '';
    let plainContent = template.plain_body || '';

    Object.entries(defaultPlaceholders).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, String(value));
      plainContent = plainContent.replace(regex, String(value));
    });

    // Configure AWS SES
    // Determine from address based on from_email_address_type
    let fromAddress = '';
    switch (template.from_email_address_type) {
      case 'no-reply':
        fromAddress = process.env.NO_REPLY_EMAIL || 'noreply@moveplan.com';
        break;
      case 'support':
        fromAddress = process.env.SUPPORT_EMAIL || 'support@moveplan.com';
        break;
      case 'info':
        fromAddress = process.env.INFO_EMAIL || 'info@moveplan.com';
        break;
      case 'custom':
        fromAddress = template.custom_from_email || process.env.NO_REPLY_EMAIL || 'noreply@moveplan.com';
        break;
      default:
        fromAddress = process.env.NO_REPLY_EMAIL || 'noreply@moveplan.com';
    }

    // Create email message in MIME format
    const boundary = `----=_Part_${Date.now()}`;
    const rawMessage = [
      `From: ${fromAddress}`,
      `To: ${test_email}`,
      `Subject: [TEST] ${template.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      plainContent,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      htmlContent,
      ``,
      `--${boundary}--`,
    ].join('\r\n');

    // Send the email via AWS SES
    const sendCommand = new SendRawEmailCommand({
      RawMessage: {
        Data: Buffer.from(rawMessage),
      },
    });

    const result = await sesClient.send(sendCommand);

    console.log('Test email sent successfully:', result.MessageId);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.MessageId,
      from: fromAddress,
      to: test_email,
      subject: `[TEST] ${template.subject}`,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in POST /api/email-templates/test:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error.message },
      { status: 500 }
    );
  }
}
