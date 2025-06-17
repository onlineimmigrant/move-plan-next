import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  try {
    const {
      organization_id,
      customer_id,
      full_name,
      email,
      phone,
      subject,
      message,
      preferred_contact_method,
      preferred_date,
      preferred_time_range,
    } = await request.json();

    if (!organization_id || !full_name || !email || !phone || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

      // Check for existing user by email
    let effectiveCustomerId = customer_id;
    if (!customer_id) {
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('organization_id', organization_id) // Ensure tenant-specific
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116: No rows found
        console.error('Error checking existing user:', userError);
        return NextResponse.json({ error: 'Failed to check user existence' }, { status: 500 });
      }

      effectiveCustomerId = existingUser?.id || null;
    }

    // Create ticket in Supabase
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        organization_id,
        customer_id: effectiveCustomerId, // Use resolved customer_id
        email, 
        full_name, 
        subject,
        message,
        preferred_contact_method,
        preferred_date,
        preferred_time_range,
      })
      .select()
      .single();

    if (ticketError || !ticket) {
      console.error('Error creating ticket:', ticketError);
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }

    // Fetch organization settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('transactional_email, domain, site, address')
      .eq('organization_id', organization_id)
      .single();

    if (settingsError || !settings) {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch organization settings' }, { status: 500 });
    }

    // Fetch email template for ticket confirmation
    const { data: template, error: templateError } = await supabase
      .from('email_template')
      .select('html_code, email_main_logo_image, subject, from_email_address_type')
      .eq('organization_id', organization_id)
      .eq('type', 'ticket_confirmation')
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1);

    if (templateError || !template?.length) {
      console.error('Error fetching email template:', templateError);
      return NextResponse.json({ error: 'Failed to fetch email template' }, { status: 500 });
    }

    const htmlCode = template[0].html_code;
    const dynamicSubject = template[0].subject || `New Ticket: ${subject}`;
    const siteValue = settings.site || 'Your Platform';
    const fromEmailAddressType = template[0].from_email_address_type || 'transactional_email';
    const privacyPolicyUrl = `https://${settings.domain}/privacy`;
    const unsubscribeUrl = `https://${settings.domain}/unsubscribe?user_id=${customer_id || ''}&type=ticket_confirmation`;
    const ticketUrl = `https://${settings.domain}/tickets/${ticket.id}`;

    // Replace placeholders in email template
    let emailHtml = htmlCode
      .replace('{{name}}', full_name)
      .replace('{{email_main_logo_image}}', template[0].email_main_logo_image || 'https://via.placeholder.com/150x50?text=Brand+Logo')
      .replace('{{emailDomainRedirection}}', ticketUrl)
      .replace('{{privacyPolicyUrl}}', privacyPolicyUrl)
      .replace('{{unsubscribeUrl}}', unsubscribeUrl)
      .replace('{{address}}', settings.address)
      .replace('{{site}}', siteValue)
      .replace('{{subject}}', dynamicSubject)
      .replace('{{ticket_subject}}', subject)
      .replace('{{ticket_message}}', message)
      .replace('{{ticket_id}}', ticket.id);

    // Generate plain-text version
    const emailText = `
Hi ${full_name},

Your ticket has been submitted successfully!

Ticket ID: ${ticket.id}
Subject: ${subject}
Message: ${message}
Preferred Contact: ${preferred_contact_method || 'Not specified'}
Preferred Date: ${preferred_date || 'Not specified'}
Preferred Time: ${preferred_time_range || 'Not specified'}

View your ticket: ${ticketUrl}

---
Unsubscribe: ${unsubscribeUrl} | Privacy Policy: ${privacyPolicyUrl}
Address: ${settings.address}
© 2025 ${siteValue}
All rights reserved.
    `.trim();

    // Determine From email
    const fromEmail = `"${siteValue} Team" <${settings.transactional_email}>`;

    // Send confirmation email to customer
    const customerRawMessage = `
From: ${fromEmail}
To: ${email}
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

    const customerCommand = new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(customerRawMessage) },
      ConfigurationSetName: 'NoTrackingConfig',
    });

    await sesClient.send(customerCommand);

    // Notify admins
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('email')
      .eq('organization_id', organization_id)
      .eq('role', 'admin');

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
    } else if (admins?.length) {
      const adminSubject = `New Ticket Submitted: ${subject}`;
      const adminHtml = emailHtml.replace('Your ticket has been submitted', 'A new ticket has been submitted');
      const adminText = emailText.replace('Your ticket has been submitted', 'A new ticket has been submitted');

      for (const admin of admins) {
        const adminRawMessage = `
From: ${fromEmail}
To: ${admin.email}
Subject: ${adminSubject}
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="boundary-admin-${Date.now()}"

--boundary-admin-${Date.now()}
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 7bit

${adminText}

--boundary-admin-${Date.now()}
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: 7bit

${adminHtml}

--boundary-admin-${Date.now()}--
        `.trim();

        const adminCommand = new SendRawEmailCommand({
          RawMessage: { Data: Buffer.from(adminRawMessage) },
          ConfigurationSetName: 'NoTrackingConfig',
        });

        await sesClient.send(adminCommand);
      }
    }

    return NextResponse.json({ message: 'Ticket created successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/tickets/create:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}