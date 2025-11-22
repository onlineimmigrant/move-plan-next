import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

export async function GET(request: Request) {
  if (!hasEnvVars) return envErrorResponse();

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get('planId');
  const organizationId = searchParams.get('organizationId');
  const organization_id = searchParams.get('organization_id'); // Support alternative param name

  // Support two modes:
  // 1. Fetch features for a specific plan: planId + organizationId
  // 2. Fetch all pricing plan features for an organization: organization_id only

  if (!planId && !organizationId && !organization_id) {
    return NextResponse.json(
      { error: 'Missing required parameters: either (planId and organizationId) or organization_id' },
      { status: 400 }
    );
  }

  try {
    // Mode 2: Fetch ALL pricing plan features for organization
    if (!planId && (organizationId || organization_id)) {
      const orgId = organizationId || organization_id;
      console.log('Fetching all pricing plan features for organization:', orgId);

      const { data: allFeatures, error } = await supabase
        .from('pricingplan_features')
        .select(`
          *,
          feature:feature_id (
            id,
            name,
            content,
            slug,
            type,
            order,
            organization_id
          ),
          pricingplan:pricingplan_id (
            id,
            organization_id
          )
        `)
        .eq('feature.organization_id', orgId);

      if (error) {
        console.error('Error fetching all pricing plan features:', error);
        return NextResponse.json(
          { error: 'Failed to fetch pricing plan features', details: error.message },
          { status: 500 }
        );
      }

      console.log(`Successfully fetched ${allFeatures?.length || 0} pricing plan features`);
      return NextResponse.json(allFeatures || []);
    }

    // Mode 1: Fetch features for a specific pricing plan
    if (!planId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters: planId and organizationId' },
        { status: 400 }
      );
    }

    console.log('Fetching features for pricing plan:', planId, 'organization:', organizationId);

    // Fetch features associated with the pricing plan
    const { data: features, error } = await supabase
      .from('pricingplan_features')
      .select(`
        feature_id,
        feature:feature_id (
          id,
          name,
          content,
          slug,
          type,
          order,
          organization_id
        )
      `)
      .eq('pricingplan_id', planId)
      .eq('feature.organization_id', organizationId)
      .order('feature(order)', { ascending: true }); // Sort by feature order

    if (error) {
      console.error('Error fetching pricing plan features:', error);
      return NextResponse.json(
        { error: 'Failed to fetch features', details: error.message },
        { status: 500 }
      );
    }

    // Transform the data to a clean format
    const transformedFeatures = (features || [])
      .map((item: any) => {
        const feature = item.feature;
        if (!feature || !feature.id) return null;
        
        return {
          id: feature.id.toString(),
          name: feature.name,
          content: feature.content || '',
          slug: feature.slug,
          type: feature.type || 'features', // Default to 'features' if no type
          order: feature.order || 999, // Default to 999 if no order specified
        };
      })
      .filter((feature: any) => feature !== null)
      .sort((a: any, b: any) => a.order - b.order); // Additional client-side sort for safety

    console.log(`Successfully fetched ${transformedFeatures.length} features for plan ${planId}`);
    return NextResponse.json(transformedFeatures);

  } catch (error) {
    console.error('Error in GET /api/pricingplan-features:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pricingplan-features
 * Create a new feature assignment to a pricing plan
 */
export async function POST(request: Request) {
  if (!hasEnvVars) return envErrorResponse();

  try {
    const body = await request.json();
    const { pricingplan_id, feature_id, description } = body;

    // Validate required fields
    if (!pricingplan_id || !feature_id) {
      return NextResponse.json(
        { error: 'Missing required fields: pricingplan_id, feature_id' },
        { status: 400 }
      );
    }

    console.log('Creating feature assignment:', { pricingplan_id, feature_id });

    // Check if association already exists
    const { data: existing, error: checkError } = await supabase
      .from('pricingplan_features')
      .select('id')
      .eq('pricingplan_id', pricingplan_id)
      .eq('feature_id', feature_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'This feature is already assigned to this pricing plan' },
        { status: 409 }
      );
    }

    const { data: pricingplanFeature, error: insertError } = await supabase
      .from('pricingplan_features')
      .insert({
        pricingplan_id,
        feature_id,
        description,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !pricingplanFeature) {
      console.error('Error creating pricingplan-feature:', insertError);
      return NextResponse.json(
        { error: `Failed to assign feature: ${insertError?.message}` },
        { status: 500 }
      );
    }

    console.log('Created pricingplan-feature:', pricingplanFeature.id);

    return NextResponse.json(pricingplanFeature, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/pricingplan-features:', error);
    return NextResponse.json(
      { error: `Failed to assign feature: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pricingplan-features
 * Update a feature assignment (mainly the description)
 */
export async function PUT(request: Request) {
  if (!hasEnvVars) return envErrorResponse();

  try {
    const body = await request.json();
    const { id, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing assignment id' }, { status: 400 });
    }

    const { data: pricingplanFeature, error: updateError } = await supabase
      .from('pricingplan_features')
      .update({ description })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !pricingplanFeature) {
      console.error('Error updating pricingplan-feature:', updateError);
      return NextResponse.json(
        { error: `Failed to update assignment: ${updateError?.message}` },
        { status: 500 }
      );
    }

    console.log('Updated pricingplan-feature:', pricingplanFeature.id);

    return NextResponse.json(pricingplanFeature);
  } catch (error) {
    console.error('Error in PUT /api/pricingplan-features:', error);
    return NextResponse.json(
      { error: `Failed to update assignment: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pricingplan-features
 * Remove a feature assignment from a pricing plan
 */
export async function DELETE(request: Request) {
  if (!hasEnvVars) return envErrorResponse();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const pricingplan_id = searchParams.get('pricingplan_id');
    const feature_id = searchParams.get('feature_id');

    // Can delete by id OR by pricingplan_id + feature_id
    if (!id && (!pricingplan_id || !feature_id)) {
      return NextResponse.json(
        { error: 'Must provide either id or both pricingplan_id and feature_id' },
        { status: 400 }
      );
    }

    let query = supabase.from('pricingplan_features').delete();

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('pricingplan_id', pricingplan_id!).eq('feature_id', feature_id!);
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      console.error('Error deleting pricingplan-feature:', deleteError);
      return NextResponse.json(
        { error: `Failed to remove feature assignment: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log('Deleted pricingplan-feature:', id || `${pricingplan_id}-${feature_id}`);

    return NextResponse.json({ message: 'Feature assignment removed successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/pricingplan-features:', error);
    return NextResponse.json(
      { error: `Failed to remove feature assignment: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
