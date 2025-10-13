// /app/api/template-sections/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
 * PUT /api/template-sections/[id]
 * Update an existing template section
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('PUT /api/template-sections/[id] - Received:', {
      id,
      body,
      bodyKeys: Object.keys(body)
    });

    // Validate required fields for update
    if (!body.section_title) {
      console.error('Validation failed: section_title is required');
      return NextResponse.json(
        { error: 'section_title is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      section_title: body.section_title,
      section_description: body.section_description || null,
      text_style_variant: body.text_style_variant || 'default',
      background_color: body.background_color || null,
      grid_columns: body.grid_columns || 3,
      is_full_width: body.is_full_width ?? false,
      is_section_title_aligned_center: body.is_section_title_aligned_center ?? false,
      is_section_title_aligned_right: body.is_section_title_aligned_right ?? false,
      is_image_bottom: body.is_image_bottom ?? false,
      is_slider: body.is_slider ?? false,
      is_reviews_section: body.is_reviews_section ?? false,
      is_help_center_section: body.is_help_center_section ?? false,
      is_real_estate_modal: body.is_real_estate_modal ?? false,
      is_brand: body.is_brand ?? false,
      is_article_slider: body.is_article_slider ?? false,
      is_contact_section: body.is_contact_section ?? false,
      is_faq_section: body.is_faq_section ?? false,
      is_pricingplans_section: body.is_pricingplans_section ?? false,
      image_metrics_height: body.image_metrics_height || null,
    };

    // Handle translation fields
    if (body.section_title_translation) {
      updateData.section_title_translation = body.section_title_translation;
    }
    if (body.section_description_translation) {
      updateData.section_description_translation = body.section_description_translation;
    }

    console.log('Prepared update data:', {
      id,
      updateData,
      updateDataKeys: Object.keys(updateData)
    });

    // Update the template section
    const { data, error } = await supabaseAdmin
      .from('website_templatesection')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating template section:', {
        id,
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint
      });
      return NextResponse.json(
        { error: 'Failed to update template section', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully updated template section:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/template-sections/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/template-sections/[id]
 * Delete a template section
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('Deleting template section:', id);

    // Delete the template section (cascading will handle related records)
    const { error } = await supabaseAdmin
      .from('website_templatesection')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template section:', error);
      return NextResponse.json(
        { error: 'Failed to delete template section', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully deleted template section:', id);

    return NextResponse.json(
      { success: true, message: 'Template section deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/template-sections/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
