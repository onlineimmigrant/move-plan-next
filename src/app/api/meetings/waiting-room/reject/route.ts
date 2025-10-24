import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/meetings/waiting-room/reject - Reject participant from waiting room
export async function POST(request: NextRequest) {
  try {
    const { booking_id, host_user_id, rejection_reason } = await request.json();

    if (!booking_id || !host_user_id) {
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

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify host has permission
    if (booking.host_user_id !== host_user_id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', host_user_id)
        .single();

      const isAdmin = profile?.role === 'admin';
      const sameOrg = profile?.organization_id === booking.organization_id;

      if (!isAdmin || !sameOrg) {
        return NextResponse.json({ 
          error: 'Unauthorized to reject this booking' 
        }, { status: 403 });
      }
    }

    // Check if in waiting status
    if (booking.status !== 'waiting') {
      return NextResponse.json({ 
        error: `Cannot reject: booking status is ${booking.status}` 
      }, { status: 400 });
    }

    // Reject and update to cancelled
    const { data: updated, error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        rejected_by: host_user_id,
        rejected_at: new Date().toISOString(),
        rejection_reason: rejection_reason || 'Rejected by host',
        cancelled_at: new Date().toISOString(),
        cancelled_by: host_user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting booking:', updateError);
      return NextResponse.json({ error: 'Failed to reject participant' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      booking: updated,
      message: 'Participant rejected'
    });

  } catch (error) {
    console.error('Error in POST /api/meetings/waiting-room/reject:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
