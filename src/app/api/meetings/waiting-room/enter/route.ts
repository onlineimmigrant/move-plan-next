import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/meetings/waiting-room/enter - Customer enters waiting room
export async function POST(request: NextRequest) {
  try {
    const { booking_id } = await request.json();

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id is required' }, { status: 400 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking can enter waiting room
    if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show') {
      return NextResponse.json({ 
        error: `Cannot enter waiting room: booking is ${booking.status}` 
      }, { status: 400 });
    }

    // If already waiting, just return success (idempotent)
    if (booking.status === 'waiting') {
      return NextResponse.json({ 
        success: true, 
        booking,
        message: 'Already in waiting room'
      });
    }

    // Update booking to waiting status
    // Note: Customer can enter waiting room even if host has already started the meeting (in_progress)
    const { data: updated, error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'waiting',
        waiting_since: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking to waiting:', updateError);
      
      // Check if error is due to missing migration
      if (updateError.message?.includes('invalid input value for enum') || 
          updateError.message?.includes('waiting') ||
          updateError.message?.includes('column') && updateError.message?.includes('waiting_since')) {
        return NextResponse.json({ 
          error: 'Database migration required. Please apply /migrations/add_waiting_status_to_bookings.sql first.',
          details: updateError.message
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: 'Failed to enter waiting room' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      booking: updated,
      message: 'Entered waiting room'
    });

  } catch (error) {
    console.error('Error in POST /api/meetings/waiting-room/enter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/meetings/waiting-room - List waiting participants for a host
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const host_user_id = searchParams.get('host_user_id');
    const organization_id = searchParams.get('organization_id');

    console.log('[GET /api/meetings/waiting-room] Request params:', { host_user_id, organization_id });

    if (!host_user_id && !organization_id) {
      return NextResponse.json({ 
        error: 'Either host_user_id or organization_id is required' 
      }, { status: 400 });
    }

    let query = supabase
      .from('bookings')
      .select(`
        *,
        meeting_type:meeting_types(*)
      `)
      .eq('status', 'waiting')
      .order('waiting_since', { ascending: true });

    if (host_user_id) {
      query = query.eq('host_user_id', host_user_id);
    } else if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    const { data: waitingBookings, error } = await query;

    console.log('[GET /api/meetings/waiting-room] Query result:', { 
      count: waitingBookings?.length || 0,
      bookings: waitingBookings?.map(b => ({ id: b.id, status: b.status, customer_name: b.customer_name })),
      error 
    });

    if (error) {
      console.error('Error fetching waiting participants:', error);
      
      // Check if error is due to missing migration
      if (error.message?.includes('invalid input value for enum') || 
          error.message?.includes('waiting')) {
        return NextResponse.json({ 
          error: 'Database migration required. Please apply /migrations/add_waiting_status_to_bookings.sql first.',
          details: error.message,
          waiting_participants: [] // Return empty array so UI doesn't break
        }, { status: 200 }); // Return 200 so polling doesn't spam errors
      }
      
      return NextResponse.json({ error: 'Failed to fetch waiting participants' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      waiting_participants: waitingBookings || []
    });

  } catch (error) {
    console.error('Error in GET /api/meetings/waiting-room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
