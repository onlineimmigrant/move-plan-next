const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPricingPlanFeatures() {
  console.log('Testing pricing plan features relationships...');
  
  try {
    // First, let's find organizations and their feature/plan counts
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('\n=== RECENT ORGANIZATIONS WITH COUNTS ===');
    if (orgs) {
      for (const org of orgs) {
        const { data: features, count: featureCount } = await supabase
          .from('feature')
          .select('id', { count: 'exact' })
          .eq('organization_id', org.id);
          
        const { data: plans, count: planCount } = await supabase
          .from('pricingplan')
          .select('id', { count: 'exact' })
          .eq('organization_id', org.id);
          
        console.log(`${org.name}: ${featureCount || 0} features, ${planCount || 0} plans`);
      }
    }

    // Find source and cloned orgs
    const sourceOrg = orgs?.find(org => org.name.includes('onlineimmigrant'));
    const clonedOrg = orgs?.find(org => org.name.includes('clone13-metexam') || org.name.includes('clon12-metexam'));

    if (sourceOrg) {
      console.log(`\n=== SOURCE ORG: ${sourceOrg.name} (${sourceOrg.id}) ===`);
      
      // Check source org features and pricing plans
      const { data: sourceFeatures, error: sourceFeaturesError } = await supabase
        .from('feature')
        .select('id, name')
        .eq('organization_id', sourceOrg.id);
        
      const { data: sourcePricingPlans, error: sourcePlansError } = await supabase
        .from('pricingplan')
        .select('id, name')
        .eq('organization_id', sourceOrg.id);
      
      console.log('Source Features Count:', sourceFeatures?.length || 0);
      console.log('Source Pricing Plans Count:', sourcePricingPlans?.length || 0);
      
      if (sourcePricingPlans && sourcePricingPlans.length > 0) {
        // Check source org pricing plan features
        const { data: sourcePricingPlanFeatures, error: sourceError } = await supabase
          .from('pricingplan_features')
          .select('*')
          .in('pricingplan_id', sourcePricingPlans.map(p => p.id));

        console.log('Source Pricing Plan Features Count:', sourcePricingPlanFeatures?.length || 0);
        console.log('Source Error:', sourceError?.message || 'None');
      }
    }

    if (clonedOrg) {
      console.log(`\n=== CLONED ORG: ${clonedOrg.name} (${clonedOrg.id}) ===`);
      
      // Check cloned features and pricing plans
      const { data: clonedFeatures, count: clonedFeatureCount } = await supabase
        .from('feature')
        .select('id', { count: 'exact' })
        .eq('organization_id', clonedOrg.id);
        
      const { data: clonedPricingPlans, count: clonedPlanCount } = await supabase
        .from('pricingplan')
        .select('id', { count: 'exact' })
        .eq('organization_id', clonedOrg.id);

      console.log('Cloned Features Count:', clonedFeatureCount || 0);
      console.log('Cloned Pricing Plans Count:', clonedPlanCount || 0);
      
      if (clonedPlanCount && clonedPlanCount > 0) {
        // Get actual pricing plans to check for features
        const { data: planIds } = await supabase
          .from('pricingplan')
          .select('id')
          .eq('organization_id', clonedOrg.id);
          
        const { data: clonedPricingPlanFeatures, count: clonedFeaturesCount } = await supabase
          .from('pricingplan_features')
          .select('*', { count: 'exact' })
          .in('pricingplan_id', planIds?.map(p => p.id) || []);
          
        console.log('Cloned Pricing Plan Features Count:', clonedFeaturesCount || 0);
        
        if (clonedFeaturesCount === 0) {
          console.log('❌ NO PRICING PLAN FEATURES FOUND IN CLONED ORG');
          
          // Debug: Check what features and pricing plan IDs exist
          const { data: sampleFeatures } = await supabase
            .from('feature')
            .select('id')
            .eq('organization_id', clonedOrg.id)
            .limit(3);
            
          console.log('Sample cloned feature IDs:', sampleFeatures?.map(f => f.id));
          console.log('Sample cloned plan IDs:', planIds?.slice(0, 3)?.map(p => p.id));
        } else {
          console.log('✅ Pricing plan features found in cloned org');
        }
      }
      
      if (clonedPricingPlanFeatures?.length === 0) {
        console.log('❌ NO PRICING PLAN FEATURES FOUND IN CLONED ORG');
      } else {
        console.log('✅ Pricing plan features found in cloned org');
      }
    } else {
      console.log('❌ No cloned organization found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPricingPlanFeatures();
