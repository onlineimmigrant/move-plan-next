import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCacheHeaders } from './headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all data needed to render a comparison section
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('section_id');
    const organizationId = searchParams.get('organization_id');
    const planIdOverride = searchParams.get('plan_id');
    const competitorIdsOverrideRaw = searchParams.get('competitor_ids');

    if (!sectionId || !organizationId) {
      return NextResponse.json(
        { error: 'section_id and organization_id are required' },
        { status: 400 }
      );
    }

    // Fetch organization info for currency and site name
    const [
      { data: organization, error: orgError },
      { data: settings, error: settingsError },
      { data: section, error: sectionError }
    ] = await Promise.all([
      supabase
        .from('organizations')
        .select('default_currency')
        .eq('id', organizationId)
        .single(),
      supabase
        .from('settings')
        .select('site')
        .eq('organization_id', organizationId)
        .single(),
      supabase
        .from('website_templatesection')
        .select('*')
        .eq('id', sectionId)
        .single()
    ]);

    if (orgError) {
      console.error('Error fetching organization:', orgError);
    }

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
    }

    if (sectionError) throw sectionError;

    const config: any = section.comparison_config || {};
    const competitorIdsFromConfig: string[] = config.competitor_ids || [];

    const effectivePlanId = planIdOverride || config.selected_plan_id;

    const effectiveCompetitorIds: string[] = (() => {
      if (!competitorIdsOverrideRaw) return competitorIdsFromConfig;
      const ids = competitorIdsOverrideRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return ids.length > 0 ? ids : competitorIdsFromConfig;
    })();

    // Fetch all available competitors for switching/adding
    const [
      { data: availableCompetitors, error: availableCompetitorsError },
      { data: competitors, error: competitorsError }
    ] = await Promise.all([
      supabase
        .from('comparison_competitor')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      effectiveCompetitorIds.length > 0
        ? supabase
            .from('comparison_competitor')
            .select('*')
            .in('id', effectiveCompetitorIds)
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
        : Promise.resolve({ data: [], error: null })
    ]);

    if (availableCompetitorsError) throw availableCompetitorsError;

    if (competitorsError) throw competitorsError;

    // Fetch our pricing plans
    let ourPricingPlans: any[] = [];
    let availablePricingPlans: any[] = [];
    let ourFeatures = [];
    
    if (config.mode === 'pricing' || config.mode === 'features' || config.mode === 'both') {
      // Build parallel queries
      const queries: PromiseLike<any>[] = [];
      
      // Query 1: All available plans for switching
      queries.push(
        supabase
          .from('pricingplan')
          .select(`
            id,
            type,
            price,
            annual_size_discount,
            package,
            product!product_id(
              product_name
            )
          `)
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .then(res => res)
      );
      
      // Query 2: Selected plan details (if pricing mode and plan selected)
      if (effectivePlanId && (config.mode === 'pricing' || config.mode === 'both')) {
        queries.push(
          supabase
            .from('pricingplan')
            .select(`
              *,
              product!product_id(
                product_name
              )
            `)
            .eq('id', effectivePlanId)
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .then(res => res)
        );
      } else {
        queries.push(Promise.resolve({ data: null, error: null }));
      }
      
      // Query 3: Features for selected plan (if features mode and plan selected)
      if (effectivePlanId && (config.mode === 'features' || config.mode === 'both')) {
        queries.push(
          supabase
            .from('pricingplan_features')
            .select('feature:feature_id(*)')
            .eq('pricingplan_id', effectivePlanId)
            .then(res => res)
        );
      } else {
        queries.push(Promise.resolve({ data: null, error: null }));
      }
      
      // Execute all queries in parallel
      const [
        { data: allPlans, error: allPlansError },
        { data: plans, error: plansError },
        { data: planFeatures, error: featuresError }
      ] = await Promise.all(queries);
      
      if (allPlansError) throw allPlansError;
      if (plansError) throw plansError;
      if (featuresError) throw featuresError;
      
      // Process results
      availablePricingPlans = (allPlans || []).map((plan: any) => ({
        ...plan,
        product_name: Array.isArray(plan.product) ? plan.product[0]?.product_name : plan.product?.product_name,
      }));
      
      if (plans && plans.length > 0) {
        ourPricingPlans = plans.map((plan: any) => ({
          ...plan,
          product_name: Array.isArray(plan.product) ? plan.product[0]?.product_name : plan.product?.product_name
        }));
      }
      
      if (planFeatures && planFeatures.length > 0) {
        ourFeatures = planFeatures
          .map((item: any) => ({
            ...item.feature,
            plan_id: effectivePlanId,
            status: 'available'
          }))
          .filter((f: any) => f && f.organization_id === organizationId);
      }
    }

    console.log('Section data - competitors with features:', competitors?.map((c: any) => ({
      id: c.id,
      name: c.name,
      features_count: c.data?.features?.length || 0,
      plans_count: c.data?.plans?.length || 0
    })));
    console.log('Section data - ourFeatures count:', ourFeatures.length);

    // Optimize payload: filter competitor data to only include relevant plan and features
    const optimizedCompetitors = (competitors || []).map((competitor: any) => {
      const competitorData = competitor.data || {};
      
      // Filter plans to only the selected plan if specified
      let filteredPlans = competitorData.plans || [];
      if (effectivePlanId && filteredPlans.length > 0) {
        filteredPlans = filteredPlans.filter((p: any) => p.our_plan_id === effectivePlanId);
      }
      
      // Filter features to only those matching selected plan if specified
      let filteredFeatures = competitorData.features || [];
      if (effectivePlanId && filteredFeatures.length > 0) {
        filteredFeatures = filteredFeatures.filter((f: any) => f.our_plan_id === effectivePlanId);
      }
      
      return {
        ...competitor,
        data: {
          ...competitorData,
          plans: filteredPlans,
          features: filteredFeatures,
        }
      };
    });

    const responseData = {
      competitors: optimizedCompetitors,
      availableCompetitors: availableCompetitors || [],
      ourPricingPlans,
      availablePricingPlans,
      ourFeatures,
      config,
      currency: organization?.default_currency || '$',
      siteName: settings?.site || 'You',
    };

    return NextResponse.json(responseData, {
      headers: getCacheHeaders(),
    });
  } catch (error: any) {
    console.error('Error fetching comparison section data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comparison data' },
      { status: 500 }
    );
  }
}
