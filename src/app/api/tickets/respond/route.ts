import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { ticket_id, message, user_id, organization_id } = await request.json();

    if (!ticket_id || !message || !user_id || !organization_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
      .select('customer_id, email, subject')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      console.error('Error fetching ticket:', ticketError);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!isAdmin && ticket.customer_id !== user_id) {
      return NextResponse.json({ error: 'Unauthorized to respond to this ticket' }, { status: 403 });
    }

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

    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('domain, site')
      .eq('organization_id', organization_id)
      .single();

    if (settingsError || !settings) {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    let customerEmail = '';
    if (ticket.customer_id) {
      const { data: customer, error: customerError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', ticket.customer_id)
        .single();

      if (customerError || !customer) {
        console.error('Error fetching customer:', customerError);
      } else {
        customerEmail = customer.email;
      }
    }

    if (!customerEmail) {
      customerEmail = ticket.email;
      if (!customerEmail) {
        console.error('No customer email found');
        return NextResponse.json({ error: 'No customer email found' }, { status: 400 });
      }
    }

    const ticketUrl = `https://${settings.domain}/account/profile/tickets/${ticket_id}`;

    // Send email via /api/send-email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ticket_response',
        to: customerEmail,
        organization_id,
        user_id: ticket.customer_id,
        name: customerEmail.split('@')[0],
        emailDomainRedirection: ticketUrl,
        placeholders: {
          ticket_id,
          ticket_subject: ticket.subject || 'No Subject',
          response_message: message || '',
        },
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Error sending email:', errorData);
      return NextResponse.json({ error: 'Failed to send email', details: errorData }, { status: 500 });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/tickets/respond:', error);
    return NextResponse.json(
      { error: 'Failed to respond to ticket', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}