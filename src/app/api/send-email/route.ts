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
    meeting_invitation: `
Hi ${name},

You've been invited to a video meeting!

Meeting: ${placeholders.meeting_title || 'Video Meeting'}
Host: ${placeholders.host_name || 'Your host'}
Date & Time: ${placeholders.meeting_time || 'See link for details'}
Duration: ${placeholders.duration_minutes || '30'} minutes

${placeholders.meeting_notes ? `Notes: ${placeholders.meeting_notes}\n\n` : ''}Join the meeting: ${emailDomainRedirection}

Meeting Link: ${emailDomainRedirection}

Please join at the scheduled time. If this is an instant meeting, you can join now!

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

// Function to get default subject based on email type
const getDefaultSubject = (type: string): string => {
  const subjects: { [key: string]: string } = {
    welcome: 'Welcome to {{site}}!',
    reset_email: 'Reset Your Password - {{site}}',
    email_confirmation: 'Confirm Your Email - {{site}}',
    order_confirmation: 'Order Confirmation - {{site}}',
    free_trial_registration: 'Your Free Trial is Ready - {{site}}',
    ticket_confirmation: 'Ticket Confirmation - {{site}}',
    newsletter: 'Newsletter from {{site}}',
  };
  return subjects[type] || 'Message from {{site}}';
};

// Function to generate default HTML template based on email type
const generateDefaultHtmlTemplate = (type: string): string => {
  const baseTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background-color: #4F46E5; padding: 30px 20px; text-align: center; }
    .logo { max-width: 150px; height: auto; }
    .content { padding: 30px 20px; }
    .content h1 { color: #4F46E5; margin-top: 0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .button:hover { background-color: #4338CA; }
    .info-box { background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .info-row { margin: 8px 0; }
    .info-label { font-weight: bold; color: #4F46E5; }
    .footer { background-color: #F9FAFB; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; }
    .footer a { color: #4F46E5; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{email_main_logo_image}}" alt="{{site}} Logo" class="logo">
    </div>
    <div class="content">
      {{CONTENT}}
    </div>
    <div class="footer">
      <p>&copy; 2025 {{site}}. All rights reserved.</p>
      <p>{{address}}</p>
      <p>
        <a href="{{privacyPolicyUrl}}">Privacy Policy</a> | 
        <a href="{{unsubscribeUrl}}">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const contentTemplates: { [key: string]: string } = {
    ticket_confirmation: `
      <h1>Hi {{name}},</h1>
      <p>Thank you for contacting us! Your support ticket has been successfully submitted.</p>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Ticket ID:</span> {{ticket_id}}</div>
        <div class="info-row"><span class="info-label">Subject:</span> {{ticket_subject}}</div>
        <div class="info-row"><span class="info-label">Message:</span> {{ticket_message}}</div>
        <div class="info-row"><span class="info-label">Preferred Contact:</span> {{preferred_contact_method}}</div>
        <div class="info-row"><span class="info-label">Preferred Date:</span> {{preferred_date}}</div>
        <div class="info-row"><span class="info-label">Preferred Time:</span> {{preferred_time_range}}</div>
      </div>
      <p>Our team will review your request and get back to you as soon as possible.</p>
      <a href="{{emailDomainRedirection}}" class="button">View Ticket Status</a>
    `,
    welcome: `
      <h1>Welcome, {{name}}!</h1>
      <p>Thank you for joining {{site}}! We're excited to have you on board.</p>
      <p>Get started by setting up your account and exploring our features.</p>
      <a href="{{emailDomainRedirection}}" class="button">Get Started</a>
    `,
    reset_email: `
      <h1>Hi {{name}},</h1>
      <p>We received a request to reset your {{site}} password.</p>
      <p>Click the button below to reset your password:</p>
      <a href="{{emailDomainRedirection}}" class="button">Reset Password</a>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
    email_confirmation: `
      <h1>Hi {{name}},</h1>
      <p>Please confirm your email address to complete your registration.</p>
      <a href="{{emailDomainRedirection}}" class="button">Confirm Email</a>
      <p>If you didn't sign up for {{site}}, you can safely ignore this email.</p>
    `,
    order_confirmation: `
      <h1>Hi {{name}},</h1>
      <p>Your order has been confirmed!</p>
      <p>Thank you for your purchase. You can view your order details below.</p>
      <a href="{{emailDomainRedirection}}" class="button">View Order Details</a>
    `,
    free_trial_registration: `
      <h1>Hi {{name}},</h1>
      <p>Your free trial with {{site}} has been activated!</p>
      <p>You now have full access to all features. Start exploring now!</p>
      <a href="{{emailDomainRedirection}}" class="button">Access Your Account</a>
    `,
    newsletter: `
      <h1>Hi {{name}},</h1>
      <p>Here's the latest news from {{site}}!</p>
      <a href="{{emailDomainRedirection}}" class="button">Read More</a>
    `,
    meeting_invitation: `
      <h1>Hi {{name}},</h1>
      <p>You've been invited to a video meeting!</p>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Meeting:</span> {{meeting_title}}</div>
        <div class="info-row"><span class="info-label">Host:</span> {{host_name}}</div>
        <div class="info-row"><span class="info-label">Date & Time:</span> {{meeting_time}}</div>
        <div class="info-row"><span class="info-label">Duration:</span> {{duration_minutes}} minutes</div>
        {{meeting_notes_html}}
      </div>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{emailDomainRedirection}}" class="button" style="font-size: 16px; padding: 15px 30px;">Join Video Meeting</a>
      </p>
      <p style="color: #6B7280; font-size: 14px;">Please join at the scheduled time. If this is an instant meeting, you can join now!</p>
      <p style="color: #6B7280; font-size: 12px;">Meeting Link: <a href="{{emailDomainRedirection}}" style="color: #4F46E5;">{{emailDomainRedirection}}</a></p>
    `,
  };

  const content = contentTemplates[type] || `
    <h1>Hi {{name}},</h1>
    <p>You have received a message from {{site}}.</p>
    <a href="{{emailDomainRedirection}}" class="button">View Details</a>
  `;

  return baseTemplate.replace('{{CONTENT}}', content);
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

    // If there's a query error (not just empty results), return error
    if (templateError) {
      console.error('Error fetching email template:', { error: templateError?.message, organization_id, type });
      return NextResponse.json(
        { error: 'Failed to fetch email template', details: templateError?.message },
        { status: 500 }
      );
    }

    // If no template found, use default fallback template
    let htmlCode: string;
    let templateSubject: string;
    let templateLogo: string;
    let fromEmailAddressType: string;

    if (!template || !template.length) {
      console.warn('No custom email template found, using default template:', { organization_id, type });
      
      // Generate default HTML template
      htmlCode = generateDefaultHtmlTemplate(type);
      templateSubject = getDefaultSubject(type);
      templateLogo = 'https://via.placeholder.com/150x50?text=Brand+Logo';
      fromEmailAddressType = 'transactional_email';
    } else {
      htmlCode = template[0].html_code;
      templateSubject = template[0].subject;
      templateLogo = template[0].email_main_logo_image || 'https://via.placeholder.com/150x50?text=Brand+Logo';
      fromEmailAddressType = template[0].from_email_address_type || 'transactional_email';
    }

    const effectiveEmailDomainRedirection = emailDomainRedirection || `https://${settings.domain}/account`;
    const privacyPolicyUrl = `https://${settings.domain}/privacy-policy`;
    const unsubscribeUrl = `https://${settings.domain}/unsubscribe?user_id=${user_id || ''}&type=${type}`;
    const siteValue = settings.site || 'Metexam';
    const effectiveName = name || profile?.full_name || to.split('@')[0];

    // Replace standard placeholders
    let emailHtml = htmlCode
      .replace(/{{name}}/g, effectiveName)
      .replace(/{{email_main_logo_image}}/g, templateLogo)
      .replace(/{{emailDomainRedirection}}/g, effectiveEmailDomainRedirection)
      .replace(/{{privacyPolicyUrl}}/g, privacyPolicyUrl)
      .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl)
      .replace(/{{address}}/g, settings.address || '')
      .replace(/{{site}}/g, siteValue)
      .replace(/{{subject}}/g, templateSubject);

    // Replace ticket-specific placeholders
    Object.entries(finalPlaceholders).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder, 'g');
      console.log(`Replacing ${placeholder} with ${value}`);
      emailHtml = emailHtml.replace(regex, String(value || 'N/A'));
    });

    // Final subject with placeholders replaced
    const dynamicSubject = templateSubject
      .replace(/{{site}}/g, siteValue)
      .replace(/{{subject}}/g, templateSubject);

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