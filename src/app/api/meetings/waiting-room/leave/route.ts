import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/meetings/waiting-room/leave - Customer leaves waiting room
export async function POST(request: NextRequest) {
  try {
    const { booking_id } = await request.json();

    console.log('[Leave] Request:', { booking_id });

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id is required' }, { status: 400 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    console.log('[Leave] Booking query result:', { booking, error: bookingError });

    if (bookingError || !booking) {
      console.error('[Leave] Booking not found:', bookingError);
      return NextResponse.json({ 
        error: `Booking not found: ${bookingError?.message || 'unknown error'}` 
      }, { status: 404 });
    }

    // Check if in waiting status
    if (booking.status !== 'waiting') {
      console.log('[Leave] Booking is not in waiting status:', booking.status);
      
      // If already confirmed, scheduled, or completed - that's fine, just return success
      if (['confirmed', 'scheduled', 'completed', 'cancelled'].includes(booking.status)) {
        console.log('[Leave] Booking already in final state, returning success');
        return NextResponse.json({ 
          success: true,
          booking,
          message: 'Already left waiting room or meeting ended'
        });
      }
      
      // For other statuses (in_progress), don't allow leaving
      return NextResponse.json({ 
        error: `Cannot leave: booking status is ${booking.status}`,
        booking 
      }, { status: 400 });
    }

    console.log('[Leave] Updating booking back to confirmed');

    // Update booking back to confirmed (leave waiting room but keep meeting active)
    const { data: updated, error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        waiting_since: null, // Clear waiting timestamp
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .select()
      .single();

    console.log('[Leave] Update result:', { updated, error: updateError });

    if (updateError) {
      console.error('[Leave] Error updating booking:', updateError);
      return NextResponse.json({ 
        error: `Failed to leave waiting room: ${updateError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      booking: updated,
      message: 'Left waiting room'
    });

  } catch (error) {
    console.error('Error in POST /api/meetings/waiting-room/leave:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
