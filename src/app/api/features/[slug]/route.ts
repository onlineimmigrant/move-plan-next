// src/app/api/features/[slug]/route.ts
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

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  if (!hasEnvVars) return envErrorResponse();

  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    let organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        console.error('Organization not found for baseUrl:', baseUrl);
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      console.log('Using fallback organization_id:', organizationId);
    }

    console.log('Fetching feature for slug:', slug, 'organization_id:', organizationId);
    const { data: feature, error: featureError } = await supabase
      .from('feature')
      .select('*')
      .eq('slug', slug)
      .eq('organization_id', organizationId)
      .single();

    if (featureError || !feature) {
      console.error('Feature not found or error:', featureError?.message);
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    // Fetch feature media (images/videos) ordered by display_order
    const { data: featureMedia, error: mediaError } = await supabase
      .from('feature_media')
      .select('*')
      .eq('feature_id', feature.id)
      .order('display_order', { ascending: true });

    if (mediaError) {
      console.error('Feature media error:', mediaError);
      // Don't fail the request, just log the error and continue without media
    }

    // Attach media to feature
    const featureWithMedia = {
      ...feature,
      media: featureMedia || [],
      primary_media: featureMedia?.find(m => m.is_primary) || featureMedia?.[0] || null,
    };

    // Fetch associated pricing plans
    const { data: pricingPlansData, error: pricingPlansError } = await supabase
      .from('pricingplan_features')
      .select(`
        pricingplan_id,
        pricingplan:pricingplan_id (
          id,
          slug,
          package,
          measure,
          price,
          currency,
          currency_symbol,
          is_promotion,
          promotion_price,
          product:product_id (
            product_name,
            slug,
            links_to_image,
            is_displayed
          )
        )
      `)
      .eq('feature_id', feature.id)
      .eq('pricingplan.organization_id', organizationId); // Filter plans by organization_id

    if (pricingPlansError) {
      console.error('Pricing plans error:', pricingPlansError);
      return NextResponse.json(
        { error: 'Failed to fetch pricing plans', details: pricingPlansError.message },
        { status: 500 }
      );
    }

    const associatedPricingPlans = (pricingPlansData ?? []).flatMap((item: any) => {
      const plans = Array.isArray(item.pricingplan) ? item.pricingplan : item.pricingplan ? [item.pricingplan] : [];
      return plans.map((plan: any) => {
        if (!plan || !plan.id) return null;
        const product = Array.isArray(plan.product) ? plan.product[0] : plan.product;
        
        // Filter out products where is_displayed is false
        if (product?.is_displayed === false) {
          return null;
        }
        
        return {
          id: plan.id.toString(),
          slug: plan.slug ?? plan.id.toString(),
          product_name: product?.product_name ?? 'Unknown Product',
          product_slug: product?.slug ?? 'unknown',
          package: plan.package ?? undefined,
          measure: plan.measure ?? undefined,
          price: plan.price,
          currency: plan.currency,
          currency_symbol: plan.currency_symbol ?? undefined,
          is_promotion: plan.is_promotion ?? false,
          promotion_price: plan.promotion_price ?? undefined,
          product: {
            links_to_image: product?.links_to_image ?? undefined,
            is_displayed: product?.is_displayed ?? true,
          },
        };
      }).filter((plan: any) => plan !== null);
    });

    return NextResponse.json({
      feature: featureWithMedia,
      pricingPlans: associatedPricingPlans,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/features/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}