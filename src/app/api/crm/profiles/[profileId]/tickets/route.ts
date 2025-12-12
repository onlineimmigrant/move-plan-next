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
      .select('*')
      .eq('customer_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tickets', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ tickets: tickets || [] });
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
    const supabase = supabaseServer;
    const { profileId } = await params;
    const body = await request.json();

    const { title, description, priority, customer_id } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get the current user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile to find organization_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    // Create the ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        title,
        description: description || null,
        priority: priority || 'medium',
        status: 'open',
        customer_id: customer_id || profileId,
        organization_id: profile.organization_id,
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
