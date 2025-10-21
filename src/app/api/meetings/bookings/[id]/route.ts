import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const updateBookingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().optional(),
  cancellation_reason: z.string().optional(),
});

// GET /api/meetings/bookings/[id] - Get single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        meeting_type:meeting_types(*),
        meeting_participants(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      console.error('Error fetching booking:', error);
      return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
    }

    return NextResponse.json({ booking });

  } catch (error) {
    console.error('Error in GET /api/meetings/bookings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/meetings/bookings/[id] - Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateBookingSchema.parse(body);

    // Check if booking exists and get current data
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    // Handle cancellation
    if (validatedData.status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      // TODO: Get current user ID for cancelled_by
      // updateData.cancelled_by = currentUserId;
    }

    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        meeting_type:meeting_types(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // TODO: Send status update notifications
    // TODO: Handle meeting room cleanup if cancelled

    return NextResponse.json({ booking });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Error in PUT /api/meetings/bookings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/meetings/bookings/[id] - Permanently delete booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Check if booking exists and belongs to organization
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Prevent deletion of completed bookings (for record keeping)
    if (existingBooking.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot delete completed bookings. Please cancel them instead.' 
      }, { status: 400 });
    }

    // Permanently delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (deleteError) {
      console.error('Error deleting booking:', deleteError);
      return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
    }

    // TODO: Clean up related records (participants, etc.)
    // TODO: Send deletion notifications if needed

    return NextResponse.json({ success: true, message: 'Booking permanently deleted' });

  } catch (error) {
    console.error('Error in DELETE /api/meetings/bookings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}