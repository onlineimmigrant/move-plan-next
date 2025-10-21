import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const updateMeetingTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  duration_minutes: z.number().min(15).max(480).optional(),
  buffer_minutes: z.number().min(0).max(120).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().max(50).optional(),
  is_active: z.boolean().optional(),
});

// GET /api/meetings/meeting-types/[id] - Get single meeting type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: meetingType, error } = await supabase
      .from('meeting_types')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Meeting type not found' }, { status: 404 });
      }
      console.error('Error fetching meeting type:', error);
      return NextResponse.json({ error: 'Failed to fetch meeting type' }, { status: 500 });
    }

    return NextResponse.json({ meeting_type: meetingType });

  } catch (error) {
    console.error('Error in GET /api/meetings/meeting-types/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/meetings/meeting-types/[id] - Update meeting type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateMeetingTypeSchema.parse(body);

    const { data: meetingType, error } = await supabase
      .from('meeting_types')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Meeting type not found' }, { status: 404 });
      }
      console.error('Error updating meeting type:', error);
      return NextResponse.json({ error: 'Failed to update meeting type' }, { status: 500 });
    }

    return NextResponse.json({ meeting_type: meetingType });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Error in PUT /api/meetings/meeting-types/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/meetings/meeting-types/[id] - Deactivate meeting type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete by setting is_active to false
    const { data: meetingType, error } = await supabase
      .from('meeting_types')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Meeting type not found' }, { status: 404 });
      }
      console.error('Error deactivating meeting type:', error);
      return NextResponse.json({ error: 'Failed to deactivate meeting type' }, { status: 500 });
    }

    return NextResponse.json({ meeting_type: meetingType });

  } catch (error) {
    console.error('Error in DELETE /api/meetings/meeting-types/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}