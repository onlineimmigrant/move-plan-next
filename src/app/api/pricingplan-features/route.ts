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

  if (!planId || !organizationId) {
    return NextResponse.json(
      { error: 'Missing required parameters: planId and organizationId' },
      { status: 400 }
    );
  }

  try {
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
