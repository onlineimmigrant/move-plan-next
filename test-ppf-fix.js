require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rgbmdfaoowqbgshjuwwm.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testPricingPlanFeaturesCloning() {
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    console.log('🔍 Testing Pricing Plan Features Cloning Logic');
    
    // Step 1: Get pricing plan IDs from source organization
    console.log('\n1. Getting source pricing plan IDs:');
    const { data: sourcePricingPlanIds, error: sourcePlanIdsError } = await supabase
      .from('pricingplan')
      .select('id')
      .eq('organization_id', sourceOrgId);

    console.log('   Pricing Plan IDs found:', sourcePricingPlanIds?.length || 0);
    if (sourcePlanIdsError) {
      console.log('   ❌ Error:', sourcePlanIdsError);
      return;
    }

    // Step 2: Get pricing plan features using NEW approach
    console.log('\n2. Getting pricing plan features using NEW approach:');
    const { data: sourcePricingPlanFeatures, error: pricingPlanFeaturesError } = await supabase
      .from('pricingplan_features')
      .select('*')
      .in('pricingplan_id', sourcePricingPlanIds.map(p => p.id));

    console.log('   Pricing Plan Features found:', sourcePricingPlanFeatures?.length || 0);
    if (pricingPlanFeaturesError) {
      console.log('   ❌ Error:', pricingPlanFeaturesError.message);
    } else if (sourcePricingPlanFeatures?.length > 0) {
      console.log('   ✅ NEW approach works!');
    }

    // Step 3: Test OLD approach
    console.log('\n3. Testing OLD query approach:');
    const { data: oldQueryResults, error: oldQueryError } = await supabase
      .from('pricingplan_features')
      .select('*, feature:feature_id (organization_id)')
      .eq('feature.organization_id', sourceOrgId);

    console.log('   Old query results:', oldQueryResults?.length || 0);
    if (oldQueryError) {
      console.log('   ❌ Old query error:', oldQueryError.message);
      console.log('   This explains why pricing plan features were not being cloned!');
    } else {
      console.log('   ✅ Old query also worked');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPricingPlanFeaturesCloning();
