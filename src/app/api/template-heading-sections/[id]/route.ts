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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('Updating template heading section:', id, body);

    // Validate required fields for update
    if (!body.content?.title) {
      return NextResponse.json(
        { error: 'content.title is required' },
        { status: 400 }
      );
    }

    // Prepare update data with new JSONB structure
    const updateData: any = {
      url_page: body.url_page,
      comment: body.comment || null,
      content: {
        title: body.content.title,
        description: body.content.description || null,
        image: body.content.image || null,
        button: {
          text: body.content.button?.text || null,
          url: body.content.button?.url || null,
          is_text_link: body.content.button?.is_text_link ?? true,
        },
      },
      translations: body.translations || {},
      style: {
        background_color: body.style?.background_color || 'white',
        title: {
          color: body.style?.title?.color || null,
          size: body.style?.title?.size || '3xl',
          font: body.style?.title?.font || 'sans',
          weight: body.style?.title?.weight || 'bold',
        },
        description: {
          color: body.style?.description?.color || null,
          size: body.style?.description?.size || 'md',
          font: body.style?.description?.font || 'sans',
          weight: body.style?.description?.weight || 'normal',
        },
        button: {
          color: body.style?.button?.color || null,
          text_color: body.style?.button?.text_color || 'white',
        },
        alignment: body.style?.alignment || 'left',
        image_first: body.style?.image_first ?? false,
        image_style: body.style?.image_style || 'default',
        gradient: body.style?.gradient || { enabled: false },
      },
    };

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
