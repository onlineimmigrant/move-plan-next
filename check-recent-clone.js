// Check if a recent clone has pricing plans and features
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentClone() {
  console.log('🔍 Checking Recent Clone for Pricing Plans and Features\n');

  // Get the most recent clone
  const { data: recentClone } = await supabase
    .from('organizations')
    .select('*')
    .eq('type', 'education')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log(`📊 Checking: ${recentClone.name} (${recentClone.id})`);

  // Check all related data
  const { data: products, count: productCount } = await supabase
    .from('product')
    .select('*', { count: 'exact' })
    .eq('organization_id', recentClone.id);

  const { data: features, count: featureCount } = await supabase
    .from('feature')
    .select('*', { count: 'exact' })
    .eq('organization_id', recentClone.id);

  const { data: pricingPlans, count: pricingPlanCount } = await supabase
    .from('pricingplan')
    .select('*', { count: 'exact' })
    .eq('organization_id', recentClone.id);

  console.log(`\n📈 Current Status:
   Products: ${productCount}
   Features: ${featureCount}
   Pricing Plans: ${pricingPlanCount}`);

  // Check if any pricing plans exist
  if (pricingPlanCount === 0) {
    console.log('\n❌ No pricing plans found - this is the root issue!');
    console.log('💡 Pricing plans are not being cloned, so pricing plan features can\'t be created');
    
    // Check source organization for comparison
    const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
    const { count: sourcePricingPlanCount } = await supabase
      .from('pricingplan')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', sourceOrgId);
      
    console.log(`\n📋 Source organization has ${sourcePricingPlanCount} pricing plans`);
  } else {
    // Check pricing plan features
    const pricingPlanIds = pricingPlans.map(p => p.id);
    const { data: pricingPlanFeatures, count: pfCount } = await supabase
      .from('pricingplan_features')
      .select('*', { count: 'exact' })
      .in('pricingplan_id', pricingPlanIds);

    console.log(`   Pricing Plan Features: ${pfCount}`);
    
    if (pfCount > 0) {
      console.log('\n✅ Pricing plan features exist!');
    } else {
      console.log('\n❌ No pricing plan features - need to investigate why');
    }
  }

  // Check what steps completed in the clone
  console.log('\n🔍 Checking what was actually cloned...');
  const tables = ['product', 'feature', 'pricingplan', 'pricingplan_features'];
  
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq(table === 'pricingplan_features' ? 'id' : 'organization_id', 
          table === 'pricingplan_features' ? 'not-applicable' : recentClone.id);
    
    if (table === 'pricingplan_features' && pricingPlans && pricingPlans.length > 0) {
      const { count: pfCount } = await supabase
        .from('pricingplan_features')
        .select('*', { count: 'exact', head: true })
        .in('pricingplan_id', pricingPlans.map(p => p.id));
      console.log(`   ${table}: ${pfCount}`);
    } else if (table !== 'pricingplan_features') {
      console.log(`   ${table}: ${count}`);
    }
  }
}

checkRecentClone();
