import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/meetings/waiting-room/approve - Approve participant from waiting room
export async function POST(request: NextRequest) {
  try {
    const { booking_id, host_user_id } = await request.json();

    console.log('[Approve] Request:', { booking_id, host_user_id });

    if (!booking_id || !host_user_id) {
      console.error('[Approve] Missing required fields');
      return NextResponse.json({ 
        error: 'booking_id and host_user_id are required' 
      }, { status: 400 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    console.log('[Approve] Booking query result:', { booking, error: bookingError });

    if (bookingError || !booking) {
      console.error('[Approve] Booking not found:', bookingError);
      return NextResponse.json({ 
        error: `Booking not found: ${bookingError?.message || 'unknown error'}` 
      }, { status: 404 });
    }

    // Verify host has permission
    if (booking.host_user_id !== host_user_id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', host_user_id)
        .single();

      const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
      const sameOrg = profile?.organization_id === booking.organization_id;

      if (!isAdmin || !sameOrg) {
        return NextResponse.json({ 
          error: 'Unauthorized to approve this booking' 
        }, { status: 403 });
      }
    }

    // Check if in waiting status
    if (booking.status !== 'waiting') {
      console.error('[Approve] Invalid status:', booking.status);
      return NextResponse.json({ 
        error: `Cannot approve: booking status is ${booking.status}` 
      }, { status: 400 });
    }

    console.log('[Approve] Updating booking to in_progress');

    // Approve and update to in_progress
    const { data: updated, error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'in_progress',
        approved_by: host_user_id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .select()
      .single();

    console.log('[Approve] Update result:', { updated, error: updateError });

    if (updateError) {
      console.error('[Approve] Error updating booking:', updateError);
      return NextResponse.json({ 
        error: `Failed to approve participant: ${updateError.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      booking: updated,
      message: 'Participant approved'
    });

  } catch (error) {
    console.error('Error in POST /api/meetings/waiting-room/approve:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
