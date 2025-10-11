// /app/api/hero-section/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * PUT /api/hero-section/[id]
 * Update an existing hero section
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('[API Hero Section PUT] Updating hero section ID:', id);
    console.log('[API Hero Section PUT] Request body:', JSON.stringify(body, null, 2));

    // Prepare update data - map new JSONB structure to database columns
    const updateData: any = {};
    
    // Handle basic content fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.button !== undefined) updateData.button = body.button;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.animation_element !== undefined) updateData.animation_element = body.animation_element;

    // Handle translation fields
    if (body.title_translation !== undefined) updateData.title_translation = body.title_translation;
    if (body.description_translation !== undefined) updateData.description_translation = body.description_translation;
    if (body.button_translation !== undefined) updateData.button_translation = body.button_translation;

    // Handle JSONB style fields - store them as JSONB in database
    if (body.title_style !== undefined) updateData.title_style = body.title_style;
    if (body.description_style !== undefined) updateData.description_style = body.description_style;
    if (body.image_style !== undefined) updateData.image_style = body.image_style;
    if (body.background_style !== undefined) updateData.background_style = body.background_style;
    if (body.button_style !== undefined) updateData.button_style = body.button_style;

    console.log('[API Hero Section PUT] Update data:', JSON.stringify(updateData, null, 2));

    // Update the hero section
    const { data, error } = await supabaseAdmin
      .from('website_hero')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API Hero Section PUT] Database error:', error);
      
      // Check if this is a column not found error
      if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database schema not updated', 
            details: 'Hero table columns are missing. Please run both hero_jsonb_migration.sql and hero_content_columns_migration.sql files in your Supabase SQL Editor.',
            migration_required: true
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update hero section', details: error.message },
        { status: 500 }
      );
    }

    console.log('[API Hero Section PUT] Successfully updated:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API Hero Section PUT] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/hero-section/[id]
 * Get a specific hero section
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('[API Hero Section GET] Fetching hero section ID:', id);

    const { data, error } = await supabaseAdmin
      .from('website_hero')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API Hero Section GET] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hero section', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Hero section not found' },
        { status: 404 }
      );
    }

    console.log('[API Hero Section GET] Successfully fetched:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[API Hero Section GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
