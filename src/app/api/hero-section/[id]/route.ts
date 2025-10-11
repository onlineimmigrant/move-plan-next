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
    
    // Basic fields
    if (body.seo_title !== undefined) updateData.seo_title = body.seo_title || null;
    if (body.title !== undefined) updateData.h1_title = body.title || null;
    if (body.description !== undefined) updateData.p_description = body.description || null;
    
    // Button configuration - map from button_style JSONB
    if (body.button !== undefined) updateData.button_main_get_started = body.button || null;
    if (body.button_explore !== undefined) updateData.button_explore = body.button_explore || null;
    if (body.button_style?.url !== undefined) updateData.button_url = body.button_style.url || null;
    if (body.button_style?.aboveDescription !== undefined) updateData.button_main_above_description = body.button_style.aboveDescription ?? false;
    if (body.button_style?.isVideo !== undefined) updateData.button_main_is_for_video = body.button_style.isVideo ?? false;
    
    // Image configuration - map from image_style JSONB
    if (body.image !== undefined) updateData.image = body.image || null;
    if (body.image_style?.position !== undefined) updateData.image_position = body.image_style.position || 'right';
    
    // Legacy fields for backward compatibility (deprecated in favor of image_position)
    if (body.image_first !== undefined) updateData.image_first = body.image_first ?? false;
    if (body.is_image_full_page !== undefined) updateData.is_image_full_page = body.is_image_full_page ?? false;
    
    // Colors - map from style JSONB objects
    if (body.title_style?.color !== undefined) updateData.h1_text_color = body.title_style.color || 'sky-600';
    if (body.description_style?.color !== undefined) updateData.p_description_color = body.description_style.color || 'gray-600';
    if (body.background_style?.color !== undefined) updateData.background_color = body.background_style.color || 'white';
    
    // Layout - map from title_style JSONB
    if (body.title_style?.alignment !== undefined) updateData.title_alighnement = body.title_style.alignment || 'center';
    if (body.title_style?.blockWidth !== undefined) updateData.title_block_width = body.title_style.blockWidth || '2xl';
    if (body.title_style?.blockColumns !== undefined) updateData.title_block_columns = body.title_style.blockColumns || 1;
    
    // Display options
    if (body.is_seo_title !== undefined) updateData.is_seo_title = body.is_seo_title ?? false;
    if (body.is_h1_title !== undefined) updateData.is_h1_title = body.is_h1_title ?? true;
    if (body.is_p_description !== undefined) updateData.is_p_description = body.is_p_description ?? true;
    if (body.is_button_explore !== undefined) updateData.is_button_explore = body.is_button_explore ?? false;
    
    // Organization
    if (body.organization_id !== undefined) updateData.organization_id = body.organization_id || null;

    // Handle translation fields if provided
    if (body.h1_title_translation !== undefined) {
      updateData.h1_title_translation = body.h1_title_translation;
    }
    if (body.h1_title_part_2_translation !== undefined) {
      updateData.h1_title_part_2_translation = body.h1_title_part_2_translation;
    }
    if (body.h1_title_part_3_translation !== undefined) {
      updateData.h1_title_part_3_translation = body.h1_title_part_3_translation;
    }
    if (body.p_description_translation !== undefined) {
      updateData.p_description_translation = body.p_description_translation;
    }
    if (body.button_explore_translation !== undefined) {
      updateData.button_explore_translation = body.button_explore_translation;
    }
    if (body.seo_title_translation !== undefined) {
      updateData.seo_title_translation = body.seo_title_translation;
    }

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
            details: 'Hero table JSONB columns are missing. Please run the hero_jsonb_migration.sql file in your Supabase SQL Editor.',
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
