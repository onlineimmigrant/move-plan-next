// src/app/api/features/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

const envErrorResponse = () => {
  console.error('Missing Supabase environment variables');
  return NextResponse.json(
    { error: 'Server configuration error: Missing Supabase credentials' },
    { status: 500 }
  );
};

export async function GET(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  const { searchParams } = new URL(request.url);
  let organizationId = searchParams.get('organization_id');
  const helpCenter = searchParams.get('help_center');

  if (!organizationId) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for baseUrl:', baseUrl);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    console.log('Using fallback organization_id:', organizationId);
  }

  try {
    console.log('Fetching features for organization_id:', organizationId, 'helpCenter:', helpCenter);
    let query = supabase
      .from('feature')
      .select('*')
      .eq('organization_id', organizationId);
    
    // Filter by is_help_center if requested
    if (helpCenter === 'true') {
      query = query.eq('is_help_center', true);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch features', details: error.message },
        { status: 500 }
      );
    }

    console.log('Fetched features:', data);
    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/features:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/features
 * Create a new feature
 */
export async function POST(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  try {
    const body = await request.json();
    const { 
      name, 
      content, 
      feature_image, 
      slug, 
      display_content, 
      display_on_product_card, 
      type, 
      package: packageName, 
      order, 
      is_help_center,
      organization_id 
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }

    if (!organization_id) {
      return NextResponse.json({ error: 'Missing required field: organization_id' }, { status: 400 });
    }

    console.log('Creating feature:', { name, organization_id });

    const { data: feature, error: insertError } = await supabase
      .from('feature')
      .insert({
        name,
        content,
        feature_image,
        slug,
        display_content: display_content ?? false,
        display_on_product_card: display_on_product_card ?? false,
        type,
        package: packageName,
        order,
        is_help_center: is_help_center ?? false,
        organization_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !feature) {
      console.error('Error creating feature:', insertError);
      return NextResponse.json({ error: `Failed to create feature: ${insertError?.message}` }, { status: 500 });
    }

    console.log('Created feature:', feature.id);

    return NextResponse.json(feature, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/features:', error);
    return NextResponse.json({ error: `Failed to create feature: ${error.message}` }, { status: 500 });
  }
}

/**
 * PUT /api/features
 * Update an existing feature
 */
export async function PUT(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing feature id' }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Missing updates' }, { status: 400 });
    }

    console.log('Updating feature:', id, updates);

    const { data: feature, error: updateError } = await supabase
      .from('feature')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !feature) {
      console.error('Error updating feature:', updateError);
      return NextResponse.json({ error: `Failed to update feature: ${updateError?.message}` }, { status: 500 });
    }

    console.log('Updated feature:', feature.id);

    return NextResponse.json(feature);
  } catch (error: any) {
    console.error('Error in PUT /api/features:', error);
    return NextResponse.json({ error: `Failed to update feature: ${error.message}` }, { status: 500 });
  }
}

/**
 * DELETE /api/features
 * Delete a feature
 */
export async function DELETE(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing feature id' }, { status: 400 });
    }

    console.log('Deleting feature:', id);

    const { error: deleteError } = await supabase
      .from('feature')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting feature:', deleteError);
      return NextResponse.json({ error: `Failed to delete feature: ${deleteError.message}` }, { status: 500 });
    }

    console.log('Deleted feature:', id);

    return NextResponse.json({ message: 'Feature deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/features:', error);
    return NextResponse.json({ error: `Failed to delete feature: ${error.message}` }, { status: 500 });
  }
}