//app/api/tickets/status/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(request: Request) {
  try {
    const { ticket_id, status, organization_id, user_id } = await request.json();

    if (!ticket_id || !status || !organization_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate status values
    const validStatuses = ['open', 'in progress', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
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

    if (profile.role !== 'admin') {
      console.error('User is not an admin:', { user_id, role: profile.role });
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    console.log(`User ${user_id} (Admin) attempting to update ticket ${ticket_id} to ${status}`);

    // Update ticket status
    const { data, error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticket_id)
      .eq('organization_id', organization_id)
      .select();

    if (error) {
      console.error('Error updating ticket status:', error);
      return NextResponse.json({ error: 'Failed to update ticket status', details: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.error('No data returned from update');
      return NextResponse.json({ error: 'Update failed: No data returned' }, { status: 500 });
    }

    const updatedTicket = data[0];

    // Send email notification to customer about status change
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('domain, site')
        .eq('organization_id', organization_id)
        .single();

      if (!settingsError && settings) {
        const ticketUrl = `https://${settings.domain}/account/profile/tickets/${ticket_id}`;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

        if (baseUrl) {
          // Determine customer email
          let customerEmail = updatedTicket.email;
          if (updatedTicket.customer_id) {
            const { data: customer } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', updatedTicket.customer_id)
              .single();
            if (customer?.email) {
              customerEmail = customer.email;
            }
          }

          if (customerEmail) {
            const statusMessages = {
              'open': 'Your ticket is now open and waiting to be reviewed.',
              'in progress': 'Your ticket is being worked on by our support team.',
              'closed': 'Your ticket has been resolved and closed.'
            };

            await fetch(`${baseUrl}/api/send-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'ticket_status_update',
                to: customerEmail,
                organization_id,
                user_id: updatedTicket.customer_id,
                name: updatedTicket.full_name || 'Customer',
                emailDomainRedirection: ticketUrl,
                placeholders: {
                  ticket_id: ticket_id,
                  ticket_subject: updatedTicket.subject || 'No Subject',
                  old_status: 'previous status',
                  new_status: status,
                  status_message: statusMessages[status as keyof typeof statusMessages] || 'Status has been updated.',
                },
              }),
            });
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending status change email (non-blocking):', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ message: 'Ticket status updated successfully', data: data[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/tickets/status:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket status', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}