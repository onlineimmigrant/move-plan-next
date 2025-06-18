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
    const { ticket_id, message, user_id, organization_id } = await request.json();

    if (!ticket_id || !message || !user_id || !organization_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user via profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .eq('organization_id', organization_id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile or user not found:', profileError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isAdmin = profile.role === 'admin';
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('customer_id, email')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      console.error('Error fetching ticket:', ticketError);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Allow admins or ticket owners to respond
    if (!isAdmin && ticket.customer_id !== user_id) {
      return NextResponse.json({ error: 'Unauthorized to respond to this ticket' }, { status: 403 });
    }

    // Create response with created_at to ensure real-time event consistency
    const { data: response, error: responseError } = await supabase
      .from('ticket_responses')
      .insert({
        ticket_id,
        user_id,
        message,
        is_admin: isAdmin,
        created_at: new Date().toISOString(),
      })
      .select('id, ticket_id, user_id, message, is_admin, created_at')
      .single();

    if (responseError || !response) {
      console.error('Error creating response:', responseError);
      return NextResponse.json({ error: 'Failed to create response' }, { status: 500 });
    }

    // Fetch ticket details for email
    const { data: ticketDetails, error: ticketDetailsError } = await supabase
      .from('tickets')
      .select('subject, customer_id, preferred_contact_method, email')
      .eq('id', ticket_id)
      .single();

    if (ticketDetailsError || !ticketDetails) {
      console.error('Error fetching ticket details:', ticketDetailsError);
      return NextResponse.json({ error: 'Ticket details not found' }, { status: 404 });
    }

    // Fetch customer email
    let customerEmail = '';
    if (ticketDetails.customer_id) {
      const { data: customer, error: customerError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', ticketDetails.customer_id)
        .single();

      if (customerError || !customer) {
        console.error('Error fetching customer:', customerError);
      } else {
        customerEmail = customer.email;
      }
    }

    if (!customerEmail) {
      customerEmail = ticketDetails.email;
      if (!customerEmail) {
        console.error('No customer email found');
        return NextResponse.json({ error: 'No customer email found' }, { status: 400 });
      }
    }

    // Fetch organization settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('transactional_email, domain, site, address')
      .eq('organization_id', organization_id)
      .single();

    if (settingsError || !settings) {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Fetch email template
    const { data: template, error: templateError } = await supabase
      .from('email_template')
      .select('html_code, email_main_logo_image, subject, from_email_address_type')
      .eq('organization_id', organization_id)
      .eq('type', 'ticket_response')
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1);

    if (templateError || !template?.length) {
      console.error('Error fetching email template:', templateError);
      return NextResponse.json({ error: 'Missing email template' }, { status: 500 });
    }

    const htmlCode = template[0].html_code;
    const dynamicSubject = template[0].subject || `Update on Ticket: ${ticketDetails.subject}`;
    const siteValue = settings.site || 'Your Platform';
    const fromEmail = `"${siteValue} Team" <${settings.transactional_email}>`;
    const privacyPolicyUrl = `https://${settings.domain}/privacy`;
    const unsubscribeUrl = `https://${settings.domain}/unsubscribe?user_id=${ticketDetails.customer_id || ''}`;
    const ticketUrl = `https://${settings.domain}/tickets/${ticket_id}`;

    const emailHtml = htmlCode
      .replace('{{name}}', customerEmail.split('@')[0])
      .replace('{{email_main_logo_image}}', template[0].email_main_logo_image || ticketUrl)
      .replace('{{emailDomainRedirection}}', ticketUrl)
      .replace('{{privacyPolicyUrl}}', privacyPolicyUrl)
      .replace('{{unsubscribeUrl}}', unsubscribeUrl)
      .replace('{{address}}', settings.address)
      .replace('{{site}}', siteValue)
      .replace('{{subject}}', dynamicSubject)
      .replace('{{ticket_subject}}', ticketDetails.subject)
      .replace('{{response_message}}', message);

    const emailText = `
Hello,

You have a new response on your ticket:

Ticket ID: ${ticket_id}
Subject: ${ticketDetails.subject}
Response: ${message}

View your ticket: ${ticketUrl}

---
Unsubscribe: ${unsubscribeUrl}
Privacy Policy: ${privacyPolicyUrl}
Address: ${settings.address}
© 2025 ${siteValue}
All rights reserved.
    `.trim();

    const rawMessage = `
From: ${fromEmail}
To: ${customerEmail}
Subject: ${dynamicSubject}
List-Unsubscribe: <${unsubscribeUrl}>
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="boundary-${Date.now()}"

--boundary-${Date.now()}
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 7bit

${emailText}

--boundary-${Date.now()}
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: 7bit

${emailHtml}

--boundary-${Date.now()}--
    `.trim();

    const command = new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(rawMessage) },
      ConfigurationSetName: 'NoTrackingConfig',
    });

    await sesClient.send(command);

    // Return the inserted response to match client-side expectations
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/tickets/respond:', error);
    return NextResponse.json(
      {
        error: 'Failed to respond to ticket',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}