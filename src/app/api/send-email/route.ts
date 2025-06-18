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
const generatePlainText = (
  type: string,
  name: string,
  siteValue: string,
  emailDomainRedirection: string,
  unsubscribeUrl: string,
  privacyPolicyUrl: string,
  address: string,
  domain: string,
  placeholders: Record<string, string> = {}
): string => {
  const templates: { [key: string]: string } = {
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
    ticket_confirmation: `
Hi ${name},

Your ticket has been submitted successfully!

Ticket ID: ${placeholders.ticket_id || 'N/A'}
Subject: ${placeholders.ticket_subject || 'No Subject'}
Message: ${placeholders.ticket_message || ''}
Preferred Contact: ${placeholders.preferred_contact_method || 'Not specified'}
Preferred Date: ${placeholders.preferred_date || 'Not specified'}
Preferred Time: ${placeholders.preferred_time_range || 'Not specified'}

View your ticket: ${emailDomainRedirection}

---
Unsubscribe: ${unsubscribeUrl} | Privacy Policy: ${privacyPolicyUrl}
Address: ${address}
© 2025 ${siteValue}
All rights reserved.
    `.trim(),
    ticket_response: `
Hi ${name},

You have a new response on your ticket:

Ticket ID: ${placeholders.ticket_id || 'N/A'}
Subject: ${placeholders.ticket_subject || 'No Subject'}
Response: ${placeholders.response_message || ''}

View your ticket: ${emailDomainRedirection}

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
  `.trim();
};

export async function POST(request: Request) {
  try {
    const { type, to, organization_id, user_id, name, emailDomainRedirection, placeholders = {} } = await request.json();

    if (!type || !to || !organization_id) {
      console.error('Invalid request body:', { type, to, organization_id, user_id, name, emailDomainRedirection, placeholders });
      return NextResponse.json(
        { error: 'Missing required fields: type, to, or organization_id' },
        { status: 400 }
      );
    }

    console.log('Received request body:', { type, to, organization_id, user_id, name, emailDomainRedirection, placeholders });

    // Fetch ticket data for ticket_confirmation
    let ticketData = {};
    if (type === 'ticket_confirmation' && placeholders.ticket_id) {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('preferred_contact_method, preferred_date, preferred_time_range, subject, message')
        .eq('id', placeholders.ticket_id)
        .eq('organization_id', organization_id)
        .single();

      if (ticketError || !ticket) {
        console.error('Error fetching ticket data:', ticketError);
      } else {
        ticketData = {
          preferred_contact_method: ticket.preferred_contact_method || 'Not specified',
          preferred_date: ticket.preferred_date || 'Not specified',
          preferred_time_range: ticket.preferred_time_range || 'Not specified',
          ticket_subject: ticket.subject || 'No Subject',
          ticket_message: ticket.message || '',
        };
        console.log('Fetched ticket data:', ticketData);
      }
    }

    // Merge ticket data with provided placeholders (ticket data takes precedence)
    const finalPlaceholders = {
      ...placeholders,
      ...ticketData,
    };
    console.log('Final placeholders:', finalPlaceholders);

    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('transactional_email, marketing_email, transactional_email_2, marketing_email_2, domain, address, site')
      .eq('organization_id', organization_id)
      .single();

    if (settingsError || !settings) {
      console.error('Error fetching settings:', { error: settingsError?.message, organization_id });
      return NextResponse.json(
        { error: 'Failed to fetch organization email settings', details: settingsError?.message },
        { status: 500 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id || '')
      .single();

    if (profileError && user_id) {
      console.error('Error fetching profile:', { error: profileError?.message, user_id });
      return NextResponse.json(
        { error: 'Failed to fetch user full_name', details: profileError?.message },
        { status: 500 }
      );
    }

    const { data: template, error: templateError } = await supabase
      .from('email_template')
      .select('html_code, email_main_logo_image, subject, from_email_address_type')
      .eq('organization_id', organization_id)
      .eq('type', type)
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1);

    if (templateError || !template || !template.length) {
      console.error('Error fetching email template:', { error: templateError?.message, organization_id, type });
      return NextResponse.json(
        { error: 'Failed to fetch email template', details: templateError?.message },
        { status: 500 }
      );
    }

    const htmlCode = template[0].html_code;
    const effectiveEmailDomainRedirection = emailDomainRedirection || `https://${settings.domain}/account`;
    const privacyPolicyUrl = `https://${settings.domain}/privacy-policy`;
    const unsubscribeUrl = `https://${settings.domain}/unsubscribe?user_id=${user_id || ''}&type=${type}`;
    const dynamicSubject = template[0].subject || 'Message from Our Platform';
    const siteValue = settings.site || 'Metexam';
    const fromEmailAddressType = template[0].from_email_address_type || 'transactional_email';
    const effectiveName = name || profile?.full_name || to.split('@')[0];

    // Replace standard placeholders
    let emailHtml = htmlCode
      .replace(/{{name}}/g, effectiveName)
      .replace(/{{email_main_logo_image}}/g, template[0].email_main_logo_image || 'https://via.placeholder.com/150x50?text=Brand+Logo')
      .replace(/{{emailDomainRedirection}}/g, effectiveEmailDomainRedirection)
      .replace(/{{privacyPolicyUrl}}/g, privacyPolicyUrl)
      .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl)
      .replace(/{{address}}/g, settings.address || '')
      .replace(/{{site}}/g, siteValue)
      .replace(/{{subject}}/g, dynamicSubject);

    // Replace ticket-specific placeholders
    Object.entries(finalPlaceholders).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder, 'g');
      console.log(`Replacing ${placeholder} with ${value}`);
      emailHtml = emailHtml.replace(regex, value || 'N/A');
    });

    console.log('Original htmlCode:', htmlCode);
    console.log('Final emailHtml:', emailHtml);
    console.log('Dynamic subject:', dynamicSubject);
    console.log('Site value:', siteValue);
    console.log('From email address type:', fromEmailAddressType);

    const emailText = generatePlainText(type, effectiveName, siteValue, effectiveEmailDomainRedirection, unsubscribeUrl, privacyPolicyUrl, settings.address, settings.domain, finalPlaceholders);

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
        fromEmail = `"${siteValue} Team" <${settings.transactional_email}>`;
    }

    if (!fromEmail) {
      return NextResponse.json(
        { error: `No valid from email configured for organization and type ${fromEmailAddressType}` },
        { status: 400 }
      );
    }

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