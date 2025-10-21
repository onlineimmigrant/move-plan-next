import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getOrganizationId } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const createMeetingTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  duration_minutes: z.number().min(15).max(480).default(30),
  buffer_minutes: z.number().min(0).max(120).default(0),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().max(50).optional(),
});

const updateMeetingTypeSchema = createMeetingTypeSchema.partial();

// GET /api/meetings/meeting-types - List meeting types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        console.error('Organization not found for baseUrl:', baseUrl);
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      console.log('Using fallback organization_id:', organizationId);
    }

    const { data: meetingTypes, error } = await supabase
      .from('meeting_types')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching meeting types:', error);
      return NextResponse.json({ error: 'Failed to fetch meeting types' }, { status: 500 });
    }

    return NextResponse.json({ meeting_types: meetingTypes });

  } catch (error) {
    console.error('Error in GET /api/meetings/meeting-types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/meetings/meeting-types - Create meeting type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createMeetingTypeSchema.parse(body);

    // Get organization_id from request or context
    // For now, we'll assume it's passed in the body
    const organizationId = body.organization_id;
    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    const { data: meetingType, error } = await supabase
      .from('meeting_types')
      .insert({
        ...validatedData,
        organization_id: organizationId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating meeting type:', error);
      return NextResponse.json({ error: 'Failed to create meeting type' }, { status: 500 });
    }

    return NextResponse.json({ meeting_type: meetingType }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Error in POST /api/meetings/meeting-types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}