// /app/api/template-sections/[id]/metrics/route.ts
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
 * POST /api/template-sections/[id]/metrics
 * Add a metric to a template section
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
    const body = await request.json();

    console.log('Adding metric to section:', { sectionId, metricId: body.metric_id });

    if (!body.metric_id) {
      return NextResponse.json(
        { error: 'metric_id is required' },
        { status: 400 }
      );
    }

    // Get the highest order for this section
    const { data: existingLinks } = await supabaseAdmin
      .from('website_templatesection_metrics')
      .select('"order"')
      .eq('templatesection_id', sectionId)
      .order('order', { ascending: false })
      .limit(1);

    const nextOrder = existingLinks && existingLinks.length > 0 
      ? (existingLinks[0].order || 0) + 1 
      : 1;

    // Insert the link
    const { data, error } = await supabaseAdmin
      .from('website_templatesection_metrics')
      .insert({
        templatesection_id: parseInt(sectionId),
        metric_id: body.metric_id,
        order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding metric to section:', error);
      return NextResponse.json(
        { error: 'Failed to add metric to section', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully added metric to section:', data);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/template-sections/[id]/metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/template-sections/[id]/metrics
 * Reorder metrics in a template section
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
    const body = await request.json();

    console.log('Reordering metrics for section:', sectionId, body);

    if (!body.metric_ids || !Array.isArray(body.metric_ids)) {
      return NextResponse.json(
        { error: 'metric_ids array is required' },
        { status: 400 }
      );
    }

    // Update order for each metric
    const updates = body.metric_ids.map(async (metricId: number, index: number) => {
      return supabaseAdmin
        .from('website_templatesection_metrics')
        .update({ order: index + 1 })
        .eq('templatesection_id', sectionId)
        .eq('metric_id', metricId);
    });

    const results = await Promise.all(updates);

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errors updating order:', errors);
      return NextResponse.json(
        { error: 'Failed to update some metrics order', details: errors },
        { status: 500 }
      );
    }

    console.log('Successfully reordered metrics');

    return NextResponse.json(
      { success: true, message: 'Metrics reordered successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/template-sections/[id]/metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/template-sections/[id]/metrics?metric_id=123
 * Remove a metric from a template section
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params;
    const { searchParams } = new URL(request.url);
    const metricId = searchParams.get('metric_id');

    console.log('Removing metric from section:', { sectionId, metricId });

    if (!metricId) {
      return NextResponse.json(
        { error: 'metric_id query parameter is required' },
        { status: 400 }
      );
    }

    // Delete the link
    const { error } = await supabaseAdmin
      .from('website_templatesection_metrics')
      .delete()
      .eq('templatesection_id', sectionId)
      .eq('metric_id', metricId);

    if (error) {
      console.error('Error removing metric from section:', error);
      return NextResponse.json(
        { error: 'Failed to remove metric from section', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully removed metric from section');

    return NextResponse.json(
      { success: true, message: 'Metric removed from section successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/template-sections/[id]/metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
