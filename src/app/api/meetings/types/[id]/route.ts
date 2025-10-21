// API Route: Update/Delete Meeting Type by ID
// PUT /api/meetings/types/[id] - Update meeting type
// DELETE /api/meetings/types/[id] - Delete meeting type

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name,
      description,
      duration_minutes,
      buffer_minutes,
      is_active,
      color,
      icon,
      is_customer_choice,
      organization_id,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      name,
      description,
      duration_minutes,
      buffer_minutes,
      is_active,
      color,
      icon,
      is_customer_choice,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('meeting_types')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organization_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating meeting type:', error);
      return NextResponse.json(
        { error: 'Failed to update meeting type' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Meeting type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ meeting_type: data });
  } catch (error) {
    console.error('Error in PUT /api/meetings/types/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get('organization_id');

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    // Instead of hard delete, soft delete by setting is_active to false
    const { error } = await supabase
      .from('meeting_types')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organization_id);

    if (error) {
      console.error('Error deleting meeting type:', error);
      return NextResponse.json(
        { error: 'Failed to delete meeting type' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/meetings/types/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
