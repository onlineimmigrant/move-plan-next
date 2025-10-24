import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { TimeSlotRequest, ReserveSlotRequest } from '@/types/orders';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// GET: Fetch available time slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pricingplan_id = searchParams.get('pricingplan_id');
    const staff_id = searchParams.get('staff_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    if (!pricingplan_id) {
      return NextResponse.json(
        { success: false, error: 'pricingplan_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('service_capacity')
      .select('*')
      .eq('pricingplan_id', pricingplan_id)
      .eq('is_available', true);

    if (staff_id) {
      query = query.eq('staff_id', staff_id);
    }

    if (start_date) {
      query = query.gte('slot_start', start_date);
    }

    if (end_date) {
      query = query.lte('slot_end', end_date);
    }

    // Only show slots that aren't fully booked
    query = query.filter('current_bookings', 'lt', 'max_capacity');

    // Clean up expired reservations first
    await supabase.rpc('cleanup_expired_reservations');

    const { data: slots, error } = await query.order('slot_start', { ascending: true });

    if (error) {
      console.error('Error fetching slots:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch time slots' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slots
    });

  } catch (error) {
    console.error('Error in slots endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Reserve a time slot (10-minute soft reservation during checkout)
export async function POST(request: NextRequest) {
  try {
    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ReserveSlotRequest = await request.json();
    const { capacity_id, duration_minutes = 10 } = body;

    if (!capacity_id) {
      return NextResponse.json(
        { success: false, error: 'capacity_id is required' },
        { status: 400 }
      );
    }

    // Call the database function to reserve the slot
    const { data, error } = await supabase.rpc('reserve_time_slot', {
      p_capacity_id: capacity_id,
      p_user_id: user.id,
      p_duration_minutes: duration_minutes
    });

    if (error) {
      console.error('Error reserving slot:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to reserve time slot' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Time slot is not available' },
        { status: 409 }
      );
    }

    // Get the updated slot to return reserved_until
    const { data: slot } = await supabase
      .from('service_capacity')
      .select('*')
      .eq('id', capacity_id)
      .single();

    return NextResponse.json({
      success: true,
      reserved_until: slot?.reserved_until
    });

  } catch (error) {
    console.error('Error reserving slot:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Release a time slot reservation
export async function DELETE(request: NextRequest) {
  try {
    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const capacity_id = searchParams.get('capacity_id');

    if (!capacity_id) {
      return NextResponse.json(
        { success: false, error: 'capacity_id is required' },
        { status: 400 }
      );
    }

    // Call the database function to release the reservation
    const { data, error } = await supabase.rpc('release_reservation', {
      p_capacity_id: capacity_id,
      p_user_id: user.id
    });

    if (error) {
      console.error('Error releasing reservation:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to release reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error releasing reservation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
