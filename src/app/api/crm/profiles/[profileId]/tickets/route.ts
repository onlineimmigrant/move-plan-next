import { supabaseServer } from '@/lib/supabaseServerClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const supabase = supabaseServer;
    const { profileId } = await params;

    // Fetch tickets for this customer
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        profiles!tickets_customer_id_fkey(email, full_name)
      `)
      .eq('customer_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tickets', details: error.message },
        { status: 500 }
      );
    }

    // Fetch ticket responses separately for each ticket
    const ticketsWithResponses = await Promise.all(
      (tickets || []).map(async (ticket: any) => {
        const { data: responses } = await supabase
          .from('ticket_responses')
          .select('message, is_admin, created_at')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: false });

        const lastResponse = responses && responses.length > 0 ? responses[0] : null;

        return {
          ...ticket,
          response_count: responses?.length || 0,
          email: ticket.profiles?.email || '',
          full_name: ticket.profiles?.full_name || '',
          last_message: lastResponse?.message || ticket.message,
          last_message_is_admin: lastResponse ? lastResponse.is_admin : false,
          last_response_at: lastResponse?.created_at || ticket.created_at,
          profiles: undefined,
        };
      })
    );

    return NextResponse.json({ tickets: ticketsWithResponses });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;
    const body = await request.json();

    const { subject, message, priority, customer_id, organization_id } = body;

    // Validate required fields
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!organization_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Use service role client (bypasses RLS for admin operations)
    const supabase = supabaseServer;

    // Get customer's profile to get their email
    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', customer_id || profileId)
      .single();

    if (!customerProfile) {
      return NextResponse.json(
        { error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Create the ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        subject,
        message: message || null,
        priority: priority || 'medium',
        status: 'open',
        customer_id: customer_id || profileId,
        organization_id: organization_id,
        email: customerProfile.email,
        full_name: customerProfile.full_name,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      return NextResponse.json(
        { error: 'Failed to create ticket', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
