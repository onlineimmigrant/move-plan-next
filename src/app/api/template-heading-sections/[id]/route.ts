// /app/api/template-heading-sections/[id]/route.ts
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
 * PUT /api/template-heading-sections/[id]
 * Update an existing template heading section
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    console.log('Updating template heading section:', id, body);

    // Validate required fields for update
    if (!body.name || !body.description_text) {
      return NextResponse.json(
        { error: 'name and description_text are required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name: body.name,
      name_part_2: body.name_part_2 || null,
      name_part_3: body.name_part_3 || null,
      description_text: body.description_text,
      button_text: body.button_text || null,
      url: body.url || null,
      image: body.image || null,
      image_first: body.image_first ?? false,
      is_included_template_sections_active: body.is_included_template_sections_active ?? false,
      style_variant: body.style_variant || 'default',
      text_style_variant: body.text_style_variant || 'default',
      is_text_link: body.is_text_link ?? false,
    };

    // Handle translation fields
    if (body.name_translation) {
      updateData.name_translation = body.name_translation;
    }
    if (body.description_text_translation) {
      updateData.description_text_translation = body.description_text_translation;
    }
    if (body.button_text_translation) {
      updateData.button_text_translation = body.button_text_translation;
    }

    // Update the template heading section
    const { data, error } = await supabaseAdmin
      .from('website_templatesectionheading')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template heading section:', error);
      return NextResponse.json(
        { error: 'Failed to update template heading section', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully updated template heading section:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/template-heading-sections/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/template-heading-sections/[id]
 * Delete a template heading section
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('Deleting template heading section:', id);

    // Delete the template heading section
    const { error } = await supabaseAdmin
      .from('website_templatesectionheading')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template heading section:', error);
      return NextResponse.json(
        { error: 'Failed to delete template heading section', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully deleted template heading section:', id);

    return NextResponse.json(
      { success: true, message: 'Template heading section deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/template-heading-sections/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
