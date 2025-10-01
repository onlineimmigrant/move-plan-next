// Simple test to check if products are being cloned after server restart
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simpleCloneTest() {
  console.log('🔍 Simple Post-Restart Clone Test\n');

  // Check the latest cloned organizations to see if products are being cloned now
  const { data: recentOrgs } = await supabase
    .from('organizations')
    .select(`
      *,
      products:product(count),
      product_sub_types:product_sub_type(count),
      pricing_plans:pricing_plan(count)
    `)
    .eq('type', 'customer')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('📊 Recent Cloned Organizations Status:');
  
  if (recentOrgs && recentOrgs.length > 0) {
    for (const org of recentOrgs) {
      console.log(`\n📋 ${org.name} (${org.created_at.split('T')[0]})`);
      console.log(`   Products: ${org.products[0]?.count || 0}`);
      console.log(`   Product Sub-types: ${org.product_sub_types[0]?.count || 0}`);
      console.log(`   Pricing Plans: ${org.pricing_plans[0]?.count || 0}`);
    }
  }

  // Check the source organization status
  const { data: sourceOrg } = await supabase
    .from('organizations')
    .select(`
      *,
      products:product(count),
      product_sub_types:product_sub_type(count),
      pricing_plans:pricing_plan(count)
    `)
    .eq('name', 'metexam')
    .single();

  if (sourceOrg) {
    console.log(`\n🎯 Source Organization (metexam):`);
    console.log(`   Products: ${sourceOrg.products[0]?.count || 0}`);
    console.log(`   Product Sub-types: ${sourceOrg.product_sub_types[0]?.count || 0}`);
    console.log(`   Pricing Plans: ${sourceOrg.pricing_plans[0]?.count || 0}`);
  }

  // Conclusion
  const hasRecentCloneWithProducts = recentOrgs?.some(org => 
    (org.products[0]?.count || 0) > 0
  );

  if (hasRecentCloneWithProducts) {
    console.log('\n🎉 SUCCESS: Products are being cloned in recent organizations!');
  } else {
    console.log('\n❌ Products still not being cloned - route may need review');
  }

  // Check for any products created today to see if cloning happened recently
  const today = new Date().toISOString().split('T')[0];
  const { data: todaysProducts, count: todaysCount } = await supabase
    .from('product')
    .select('*, organization:organizations(name)', { count: 'exact' })
    .gte('created_at', today);

  console.log(`\n📈 Products created today: ${todaysCount || 0}`);
  if (todaysProducts && todaysProducts.length > 0) {
    todaysProducts.forEach(product => {
      console.log(`   - "${product.product_name}" (org: ${product.organization?.name || 'unknown'})`);
    });
  }
}

simpleCloneTest().catch(console.error);
