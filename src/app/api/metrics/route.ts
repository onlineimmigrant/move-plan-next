// /app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/supabase';

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * GET /api/metrics
 * Fetch all metrics for the organization
 */
export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    console.log('Fetching metrics for organization:', organizationId);

    // Fetch all metrics for this organization (including global ones)
    const { data: metrics, error } = await supabaseAdmin
      .from('website_metric')
      .select('*')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch metrics', details: error.message },
        { status: 500 }
      );
    }

    console.log('Fetched metrics:', metrics?.length || 0);

    return NextResponse.json(metrics || [], { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/metrics
 * Create a new metric
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Creating new metric:', body);

    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: 'title and description are required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Prepare insert data
    const insertData = {
      title: body.title,
      description: body.description,
      title_translation: body.title_translation || {},
      description_translation: body.description_translation || {},
      image: body.image || null,
      is_image_rounded_full: body.is_image_rounded_full ?? false,
      is_title_displayed: body.is_title_displayed ?? true,
      background_color: body.background_color || null,
      is_card_type: body.is_card_type ?? false,
      organization_id: organizationId,
    };

    // Insert the new metric
    const { data, error } = await supabaseAdmin
      .from('website_metric')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating metric:', error);
      return NextResponse.json(
        { error: 'Failed to create metric', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully created metric:', data);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
