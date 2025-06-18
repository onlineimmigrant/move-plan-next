import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    let effectiveCustomerId = customer_id;
    if (!customer_id) {
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('organization_id', organization_id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error checking existing user:', userError);
        return NextResponse.json({ error: 'Failed to check user existence' }, { status: 500 });
      }

      effectiveCustomerId = existingUser?.id || null;
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        organization_id,
        customer_id: effectiveCustomerId,
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

    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('domain, site')
      .eq('organization_id', organization_id)
      .single();

    if (settingsError || !settings) {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch organization settings' }, { status: 500 });
    }

    const ticketUrl = `https://${settings.domain}/account/profile/tickets/${ticket.id}`;

    // Validate BASE URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_BASE_URL is not defined');
      return NextResponse.json({ error: 'Server configuration error: BASE URL not defined' }, { status: 500 });
    }

    // Prepare placeholders
    const placeholders = {
      ticket_id: ticket.id,
      ticket_subject: subject || 'No Subject',
      ticket_message: message || '',
      preferred_contact_method: preferred_contact_method || 'Not specified',
      preferred_date: preferred_date || 'Not specified',
      preferred_time_range: preferred_time_range || 'Not specified',
    };
    console.log('Sending ticket confirmation with placeholders:', placeholders);

    // Send customer confirmation email
    const customerEmailResponse = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ticket_confirmation',
        to: email,
        organization_id,
        user_id: effectiveCustomerId,
        name: full_name,
        emailDomainRedirection: ticketUrl,
        placeholders,
      }),
    });

    if (!customerEmailResponse.ok) {
      const errorData = await customerEmailResponse.json();
      console.error('Error sending customer email:', errorData);
      return NextResponse.json({ error: 'Failed to send customer email', details: errorData }, { status: 500 });
    }

    // Notify admins
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('email')
      .eq('organization_id', organization_id)
      .eq('role', 'admin');

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
    } else if (admins?.length) {
      for (const admin of admins) {
        console.log('Sending admin notification to:', admin.email);
        const adminEmailResponse = await fetch(`${baseUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ticket_confirmation',
            to: admin.email,
            organization_id,
            user_id: null,
            name: 'Admin',
            emailDomainRedirection: ticketUrl,
            placeholders: {
              ...placeholders,
              admin_message: 'A new ticket has been submitted',
            },
          }),
        });

        if (!adminEmailResponse.ok) {
          console.error('Error sending admin email to:', admin.email, await adminEmailResponse.json());
        }
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