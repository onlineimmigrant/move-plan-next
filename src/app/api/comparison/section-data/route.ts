import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    if (!sectionId || !organizationId) {
      return NextResponse.json(
        { error: 'section_id and organization_id are required' },
        { status: 400 }
      );
    }

    // Fetch organization info for currency and site name
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('default_currency')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
    }

    // Fetch settings for site name
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('site')
      .eq('organization_id', organizationId)
      .single();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
    }

    // Fetch the template section to get config
    const { data: section, error: sectionError } = await supabase
      .from('website_templatesection')
      .select('*')
      .eq('id', sectionId)
      .single();

    if (sectionError) throw sectionError;

    const config: any = section.comparison_config || {};
    const competitorIds = config.competitor_ids || [];

    // Fetch competitors
    const { data: competitors, error: competitorsError } = await supabase
      .from('comparison_competitor')
      .select('*')
      .in('id', competitorIds)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (competitorsError) throw competitorsError;

    // Fetch our pricing plans
    let ourPricingPlans = [];
    if (config.mode === 'pricing' || config.mode === 'both') {
      // If selected_plan_id is specified, only fetch that one plan
      if (config.selected_plan_id) {
        const { data: plans, error: plansError } = await supabase
          .from('pricingplan')
          .select(`
            *,
            product!product_id(
              product_name
            )
          `)
          .eq('id', config.selected_plan_id)
          .eq('organization_id', organizationId)
          .eq('is_active', true);

        if (plansError) throw plansError;
        
        // Flatten product relation
        ourPricingPlans = plans?.map(plan => ({
          ...plan,
          product_name: Array.isArray(plan.product) ? plan.product[0]?.product_name : plan.product?.product_name
        })) || [];
      }
    }

    // Fetch our features (only for the selected plan if specified)
    let ourFeatures = [];
    if (config.mode === 'features' || config.mode === 'both') {
      if (config.selected_plan_id) {
        // Fetch features connected to the selected plan
        const { data: planFeatures, error: featuresError } = await supabase
          .from('pricingplan_features')
          .select('feature:feature_id(*)')
          .eq('pricingplan_id', config.selected_plan_id);

        if (featuresError) throw featuresError;

        // Extract and filter features
        ourFeatures = (planFeatures || [])
          .map((item: any) => item.feature)
          .filter((f: any) => f && f.organization_id === organizationId);
      } else {
        // Fallback: fetch all features if no plan selected (shouldn't happen with new logic)
        const { data: allFeatures } = await supabase
          .from('feature')
          .select('*')
          .eq('organization_id', organizationId);
        
        ourFeatures = allFeatures || [];
      }
    }

    return NextResponse.json({
      competitors: competitors || [],
      ourPricingPlans,
      ourFeatures,
      config,
      currency: organization?.default_currency || '$',
      siteName: settings?.site || 'You',
    });
  } catch (error: any) {
    console.error('Error fetching comparison section data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comparison data' },
      { status: 500 }
    );
  }
}
