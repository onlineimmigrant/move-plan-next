import { supabaseServer } from '@/lib/supabaseServerClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const supabase = supabaseServer;
    const { profileId } = await params;

    // Fetch bookings with profile info in a single query
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
        customer_id,
        meeting_type:meeting_types(
          id,
          name,
          color,
          duration_minutes
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

    // If no bookings found with customer_id, try with customer_email as fallback
    if (!bookings || bookings.length === 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', profileId)
        .single();

      if (profile?.email) {
        const { data: emailBookings, error: emailError } = await supabase
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
            customer_id,
            meeting_type:meeting_types(
              id,
              name,
              color,
              duration_minutes
            )
          `)
          .eq('customer_email', profile.email)
          .order('scheduled_at', { ascending: false });

        if (!emailError) {
          return NextResponse.json({ bookings: emailBookings || [] });
        }
      }
    }

    return NextResponse.json(
      { bookings: bookings || [] },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        }
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
