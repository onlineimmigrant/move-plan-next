import { supabaseServer } from '@/lib/supabaseServerClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const supabase = supabaseServer;
    const { profileId } = await params;

    // Fetch cases for this customer with booking and ticket counts
    const { data: cases, error } = await supabase
      .from('cases')
      .select(`
        *,
        booking_count:bookings(count),
        ticket_count:tickets(count)
      `)
      .eq('customer_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cases:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cases', details: error.message },
        { status: 500 }
      );
    }

    // Transform the data to flatten counts
    const transformedCases = (cases || []).map((c: any) => ({
      ...c,
      booking_count: Array.isArray(c.booking_count) ? c.booking_count.length : (c.booking_count?.[0]?.count || 0),
      ticket_count: Array.isArray(c.ticket_count) ? c.ticket_count.length : (c.ticket_count?.[0]?.count || 0),
    }));

    return NextResponse.json({ cases: transformedCases });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
