import { NextResponse } from 'next/server';
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { createClient } from '@supabase/supabase-js';

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

// Function to generate plain-text content based on email type
const generatePlainText = (type: string, name: string, siteValue: string, emailDomainRedirection: string, unsubscribeUrl: string, privacyPolicyUrl: string, address: string, domain: string): string => {
  const templates: { [key: string]: string } & {
    welcome: string;
    reset_email: string;
    email_confirmation: string;
    order_confirmation: string;
    free_trial_registration: string;
  } = {
    welcome: `
Welcome, ${name}!

Thank you for joining ${siteValue}! We're excited to have you on board.
Get started by setting up your account: ${emailDomainRedirection}

Next Steps:
Complete your profile to personalize your experience.

---
You're receiving this email because you signed up at ${domain}.
Unsubscribe: ${unsubscribeUrl} | Privacy Policy: ${privacyPolicyUrl}
Address: ${address}
© 2025 ${siteValue}
All rights reserved.
    `.trim(),
    reset_email: `
Hi ${name},

To reset your ${siteValue} password, click this link: ${emailDomainRedirection}

If you didn’t request this, ignore this email.
---
Unsubscribe: ${unsubscribeUrl} | Privacy Policy: ${privacyPolicyUrl}
Address: ${address}
© 2025 ${siteValue}
All rights reserved.
    `.trim(),
    email_confirmation: `
Hi ${name},

Please confirm your ${siteValue} email by clicking: ${emailDomainRedirection}

If you didn’t sign up, ignore this email.
---
Unsubscribe: ${unsubscribeUrl} | Privacy Policy: ${privacyPolicyUrl}
Address: ${address}
© 2025 ${siteValue}
All rights reserved.
    `.trim(),
    order_confirmation: `
Hi ${name},

Your order with ${siteValue} has been confirmed. Details: ${emailDomainRedirection}

Thank you for your purchase!
---
Unsubscribe: ${unsubscribeUrl} | Privacy Policy: ${privacyPolicyUrl}
Address: ${address}
© 2025 ${siteValue}
All rights reserved.
    `.trim(),
    free_trial_registration: `
Hi ${name},

Your free trial with ${siteValue} has started! Access it here: ${emailDomainRedirection}

Trial ends soon—upgrade to continue.
---
Unsubscribe: ${unsubscribeUrl} | Privacy Policy: ${privacyPolicyUrl}
Address: ${address}
© 2025 ${siteValue}
All rights reserved.
    `.trim(),
  };

  return templates[type] || `
Hi ${name},

You received a message from ${siteValue}. See details: ${emailDomainRedirection}

---
Unsubscribe: ${unsubscribeUrl} | Privacy Policy: ${privacyPolicyUrl}
Address: ${address}
© 2025 ${siteValue}
All rights reserved.
  `.trim(); // Default template for unknown types
};

export async function POST(request: Request) {
  try {
    const { type, to, organization_id, user_id, name, emailDomainRedirection } = await request.json();

    // Allow user_id to be null for certain types (e.g., reset_email)
    if (!type || !to || !organization_id) {
      console.error('Invalid request body:', { type, to, organization_id, user_id, name, emailDomainRedirection });
      return NextResponse.json(
        { error: 'Missing required fields: type, to, or organization_id' },
        { status: 400 }
      );
    }

    console.log('Received request body:', { type, to, organization_id, user_id, name, emailDomainRedirection });
    console.log('Fetching settings for organization_id:', organization_id);
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('transactional_email, marketing_email, transactional_email_2, marketing_email_2, domain, address, site')
      .eq('organization_id', organization_id)
      .single();

    if (settingsError || !settings) {
      console.error('Error fetching settings:', {
        error: settingsError?.message,
        organization_id,
        details: settingsError?.details,
      });
      return NextResponse.json(
        { error: 'Failed to fetch organization email settings', details: settingsError?.message },
        { status: 500 }
      );
    }

    console.log('Fetched settings:', settings);
    console.log('Fetching profile for user_id:', user_id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id || '') // Handle null user_id by passing empty string
      .single();

    if (profileError && user_id) { // Only log error if user_id is provided
      console.error('Error fetching profile:', { error: profileError?.message, user_id });
      return NextResponse.json(
        { error: 'Failed to fetch user full_name', details: profileError?.message },
        { status: 500 }
      );
    }

    console.log('Fetching email template for organization_id:', organization_id, 'type:', type);
    const { data: template, error: templateError } = await supabase
      .from('email_template')
      .select('html_code, email_main_logo_image, subject, from_email_address_type')
      .eq('organization_id', organization_id)
      .eq('type', type)
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1);

    if (templateError || !template || !template.length) {
      console.error('Error fetching email template:', {
        error: templateError?.message,
        organization_id,
        type,
        details: templateError?.details,
      });
      return NextResponse.json(
        { error: 'Failed to fetch email template', details: templateError?.message },
        { status: 500 }
      );
    }

    const htmlCode = template[0].html_code;
    const effectiveEmailDomainRedirection = emailDomainRedirection || `https://${settings.domain}/account`; // Use provided redirection or default
    const privacyPolicyUrl = `https://${settings.domain}/privacy`;
    const unsubscribeUrl = `https://${settings.domain}/unsubscribe?user_id=${user_id || ''}&type=${type}`;
    const dynamicSubject = template[0].subject || 'Message from Our Platform';
    const siteValue = settings.site || 'Metexam';
    const fromEmailAddressType = template[0].from_email_address_type || 'transactional_email';
    const effectiveName = name || to.split('@')[0]; // Fallback to email local part if name is not provided

    // First pass: Replace placeholders with dynamic data
    let emailHtml = htmlCode
      .replace('{{name}}', effectiveName) // Use effectiveName instead of resetEmail
      .replace('{{email_main_logo_image}}', template[0].email_main_logo_image || 'https://via.placeholder.com/150x50?text=Brand+Logo')
      .replace('{{emailDomainRedirection}}', effectiveEmailDomainRedirection)
      .replace('{{privacyPolicyUrl}}', privacyPolicyUrl)
      .replace('{{unsubscribeUrl}}', unsubscribeUrl)
      .replace('{{address}}', settings.address)
      .replace('{{site}}', siteValue)
      .replace('{{subject}}', dynamicSubject);

    // Second pass: Use regex to catch any missed {{site}} instances
    emailHtml = emailHtml.replace(/{{site}}/g, siteValue);

    console.log('Original htmlCode:', htmlCode);
    console.log('After first replace emailHtml:', emailHtml);
    console.log('After second replace emailHtml:', emailHtml);
    console.log('Dynamic subject:', dynamicSubject);
    console.log('Site value:', siteValue);
    console.log('From email address type:', fromEmailAddressType);

    // Generate plain-text version based on email type
    const emailText = generatePlainText(type, effectiveName, siteValue, effectiveEmailDomainRedirection, unsubscribeUrl, privacyPolicyUrl, settings.address, settings.domain);

    // Determine From email based on from_email_address_type
    let fromEmail: string;
    switch (fromEmailAddressType) {
      case 'transactional_email':
        fromEmail = `"${siteValue} Team" <${settings.transactional_email}>`;
        break;
      case 'marketing_email':
        fromEmail = `"${siteValue}" <${settings.marketing_email}>`;
        break;
      case 'transactional_email_2':
        fromEmail = `"${siteValue} Team" <${settings.transactional_email_2 || settings.transactional_email}>`;
        break;
      case 'marketing_email_2':
        fromEmail = `"${siteValue}" <${settings.marketing_email_2 || settings.marketing_email}>`;
        break;
      default:
        fromEmail = `"${siteValue} Team" <${settings.transactional_email}>`; // Default fallback
    }

    if (!fromEmail) {
      return NextResponse.json(
        { error: `No valid from email configured for organization and type ${fromEmailAddressType}` },
        { status: 400 }
      );
    }

    // Construct raw MIME message
    const rawMessage = `
From: ${fromEmail}
To: ${to}
Subject: ${dynamicSubject}
List-Unsubscribe: <${unsubscribeUrl}>
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="boundary-string-${Date.now()}"

--boundary-string-${Date.now()}
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 7bit

${emailText}

--boundary-string-${Date.now()}
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: 7bit

${emailHtml}

--boundary-string-${Date.now()}--
    `.trim();

    const command = new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(rawMessage) },
      ConfigurationSetName: 'NoTrackingConfig',
    });

    console.log('Sending raw email to:', to, 'with From:', fromEmail, 'and Subject:', dynamicSubject);
    await sesClient.send(command);

    console.log('Email sent successfully to:', to);
    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/send-email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}