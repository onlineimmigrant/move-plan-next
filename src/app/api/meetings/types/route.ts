// API Route: Meeting Types Management
// GET /api/meetings/types - List meeting types
// POST /api/meetings/types - Create meeting type
// PUT /api/meetings/types/[id] - Update meeting type
// DELETE /api/meetings/types/[id] - Delete meeting type

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('meeting_types')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching meeting types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch meeting types' },
        { status: 500 }
      );
    }

    return NextResponse.json({ meeting_types: data });
  } catch (error) {
    console.error('Error in GET /api/meetings/types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id,
      name,
      description,
      duration_minutes,
      buffer_minutes,
      is_active,
      color,
      icon,
      is_customer_choice,
    } = body;

    if (!organization_id || !name) {
      return NextResponse.json(
        { error: 'organization_id and name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('meeting_types')
      .insert([
        {
          organization_id,
          name,
          description: description || null,
          duration_minutes: duration_minutes || 30,
          buffer_minutes: buffer_minutes || 0,
          is_active: is_active !== undefined ? is_active : true,
          color: color || null,
          icon: icon || null,
          is_customer_choice: is_customer_choice !== undefined ? is_customer_choice : true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating meeting type:', error);
      return NextResponse.json(
        { error: 'Failed to create meeting type' },
        { status: 500 }
      );
    }

    return NextResponse.json({ meeting_type: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/meetings/types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
