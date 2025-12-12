import { supabaseServer } from '@/lib/supabaseServerClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const supabase = supabaseServer;
    const { profileId } = await params;

    // Fetch bookings for this customer
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        status,
        case_id,
        notes,
        customer_email,
        customer_name,
        meeting_type:meeting_types(
          name,
          color
        )
      `)
      .eq('customer_id', profileId)
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
