// /app/api/metrics/[id]/route.ts
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
 * PUT /api/metrics/[id]
 * Update an existing metric
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('Updating metric:', id, body);

    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: 'title and description are required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      title: body.title,
      description: body.description,
      image: body.image || null,
      is_image_rounded_full: body.is_image_rounded_full ?? false,
      is_title_displayed: body.is_title_displayed ?? true,
      background_color: body.background_color || null,
      is_card_type: body.is_card_type ?? false,
    };

    // Handle translation fields
    if (body.title_translation) {
      updateData.title_translation = body.title_translation;
    }
    if (body.description_translation) {
      updateData.description_translation = body.description_translation;
    }

    console.log('Prepared update data:', {
      id,
      updateData,
      updateDataKeys: Object.keys(updateData)
    });

    // Update the metric
    const { data, error } = await supabaseAdmin
      .from('website_metric')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating metric:', {
        id,
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint
      });
      return NextResponse.json(
        { error: 'Failed to update metric', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully updated metric:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/metrics/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/metrics/[id]
 * Partially update an existing metric (allows updating individual fields)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('Partially updating metric:', id, body);

    // Prepare update data - only include fields that are provided
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image !== undefined) updateData.image = body.image || null;
    if (body.is_image_rounded_full !== undefined) updateData.is_image_rounded_full = body.is_image_rounded_full;
    if (body.is_title_displayed !== undefined) updateData.is_title_displayed = body.is_title_displayed;
    if (body.background_color !== undefined) updateData.background_color = body.background_color || null;
    if (body.is_card_type !== undefined) updateData.is_card_type = body.is_card_type;
    if (body.is_gradient !== undefined) updateData.is_gradient = body.is_gradient;
    if (body.gradient !== undefined) updateData.gradient = body.gradient || null;
    if (body.title_translation !== undefined) updateData.title_translation = body.title_translation;
    if (body.description_translation !== undefined) updateData.description_translation = body.description_translation;

    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    console.log('Prepared partial update data:', {
      id,
      updateData,
      updateDataKeys: Object.keys(updateData)
    });

    // Update the metric
    const { data, error } = await supabaseAdmin
      .from('website_metric')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating metric:', {
        id,
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint
      });
      return NextResponse.json(
        { error: 'Failed to update metric', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully partially updated metric:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/metrics/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/metrics/[id]
 * Delete a metric
 * Query param: force=true will remove from all sections first
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    console.log('Deleting metric:', { id, force });

    // Check if metric is used in any sections
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('website_templatesection_metrics')
      .select('templatesection_id')
      .eq('metric_id', id);

    if (usageError) {
      console.error('Error checking metric usage:', usageError);
      return NextResponse.json(
        { error: 'Failed to check metric usage', details: usageError.message },
        { status: 500 }
      );
    }

    // If metric is in use and force is true, remove from all sections first
    if (usage && usage.length > 0) {
      if (force) {
        console.log(`Metric is used in ${usage.length} sections. Removing with force=true...`);
        
        // Remove from all sections
        const { error: removeError } = await supabaseAdmin
          .from('website_templatesection_metrics')
          .delete()
          .eq('metric_id', id);

        if (removeError) {
          console.error('Error removing metric from sections:', removeError);
          return NextResponse.json(
            { error: 'Failed to remove metric from sections', details: removeError.message },
            { status: 500 }
          );
        }

        console.log('Successfully removed metric from all sections');
      } else {
        // If not forcing, return error with helpful message
        return NextResponse.json(
          { 
            error: 'Cannot delete metric that is currently used in template sections',
            details: `Metric is used in ${usage.length} section(s). Use force=true to delete anyway.`,
            usageCount: usage.length
          },
          { status: 400 }
        );
      }
    }

    // Delete the metric
    const { error } = await supabaseAdmin
      .from('website_metric')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting metric:', error);
      return NextResponse.json(
        { error: 'Failed to delete metric', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully deleted metric:', id);

    return NextResponse.json(
      { success: true, message: 'Metric deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/metrics/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
