// Test the exact query used in the pricing plan features cloning
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPricingPlanFeaturesQuery() {
  console.log('🔍 Testing Pricing Plan Features Query\n');

  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891'; // metexam

  // This is the exact query from the route
  console.log('1️⃣  Testing route query...');
  const { data: sourcePricingPlanFeatures, error: pricingPlanFeaturesError } = await supabase
    .from('pricingplan_features')
    .select(`
      *,
      feature:feature_id (organization_id)
    `)
    .eq('feature.organization_id', sourceOrgId);

  console.log('Query result:', {
    count: sourcePricingPlanFeatures?.length || 0,
    error: pricingPlanFeaturesError?.message || 'none'
  });

  if (pricingPlanFeaturesError) {
    console.log('❌ Query error:', pricingPlanFeaturesError);
    return;
  }

  if (!sourcePricingPlanFeatures || sourcePricingPlanFeatures.length === 0) {
    console.log('❌ No results from route query');
    
    // Try alternative query to see what's available
    console.log('\n2️⃣  Trying alternative query...');
    const { data: allFeatures } = await supabase
      .from('pricingplan_features')
      .select(`
        *,
        feature:feature_id (organization_id, name)
      `);
    
    const orgFeatures = allFeatures?.filter(pf => 
      pf.feature && pf.feature.organization_id === sourceOrgId
    );
    
    console.log(`Alternative query found: ${orgFeatures?.length || 0} features`);
    
    if (orgFeatures && orgFeatures.length > 0) {
      console.log('✅ Alternative query works - issue is with the route query syntax');
      console.log('Sample features:');
      orgFeatures.slice(0, 3).forEach((pf, i) => {
        console.log(`   ${i+1}. Plan: ${pf.pricingplan_id}, Feature: "${pf.feature?.name}"`);
      });
    }
  } else {
    console.log(`✅ Route query works: ${sourcePricingPlanFeatures.length} features found`);
    console.log('Sample features:');
    sourcePricingPlanFeatures.slice(0, 3).forEach((pf, i) => {
      console.log(`   ${i+1}. Plan: ${pf.pricingplan_id}, Feature org: ${pf.feature?.organization_id}`);
    });
  }

  // Also check what happens with the condition
  console.log('\n3️⃣  Testing route condition...');
  const hasResults = sourcePricingPlanFeatures && sourcePricingPlanFeatures.length > 0 && !pricingPlanFeaturesError;
  console.log('Route condition (sourcePricingPlanFeatures && length > 0 && !error):', hasResults);
  
  if (!hasResults) {
    console.log('❌ Route condition fails - this is why pricing plan features aren\'t cloned');
    console.log('   sourcePricingPlanFeatures exists:', !!sourcePricingPlanFeatures);
    console.log('   length > 0:', sourcePricingPlanFeatures?.length > 0);
    console.log('   no error:', !pricingPlanFeaturesError);
  }
}

testPricingPlanFeaturesQuery();
