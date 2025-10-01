require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestCloneStatus() {
  console.log('🔍 Checking Latest Clone Status After Fixes');
  
  try {
    // Check the most recent clones
    const { data: recentOrgs } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('Recent organizations:');
    for (const org of recentOrgs || []) {
      const isSource = org.id === 'de0d5c21-787f-49c2-a665-7ff8e599c891';
      if (isSource) continue;
      
      console.log(`\n📊 ${org.name} (created: ${org.created_at.slice(0, 19)})`);
      
      // Check product sub-types
      const { data: subTypes } = await supabase
        .from('product_sub_type')
        .select('id, name, slug')
        .eq('organization_id', org.id)
        .limit(3);
      
      console.log(`   Product sub-types: ${subTypes?.length || 0}`);
      if (subTypes && subTypes.length > 0) {
        console.log(`   Sample name: "${subTypes[0].name}"`);
        console.log(`   Sample slug: "${subTypes[0].slug}"`);
        console.log(`   Names have suffix: ${subTypes[0].name.includes('(') ? 'YES (old)' : 'NO (new)'}`);
      }
      
      // Check products
      const { data: products } = await supabase
        .from('product')
        .select('id, product_name')
        .eq('organization_id', org.id);
      
      console.log(`   Products: ${products?.length || 0}`);
      if (products && products.length > 0) {
        console.log(`   ✅ SUCCESS: Products are being cloned!`);
        console.log(`   Sample: "${products[0].product_name}"`);
      } else {
        console.log(`   ❌ Products still not cloned`);
      }
      
      // Check pricing plans
      const { data: pricingPlans } = await supabase
        .from('pricingplan')
        .select('id, name, stripe_price_id')
        .eq('organization_id', org.id)
        .limit(1);
      
      console.log(`   Pricing plans: ${pricingPlans?.length || 0}`);
      if (pricingPlans && pricingPlans.length > 0) {
        console.log(`   Stripe price ID cleared: ${pricingPlans[0].stripe_price_id === null ? 'YES ✅' : 'NO ❌'}`);
      }
    }

  } catch (error) {
    console.error('❌ Check error:', error.message);
  }
}

checkLatestCloneStatus();
