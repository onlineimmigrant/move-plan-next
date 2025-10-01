const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInventoryCloning() {
  console.log('🧪 Testing Inventory Cloning Logic');
  
  try {
    // Check latest cloned organization
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .ilike('name', '%clon%')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!orgs || orgs.length === 0) {
      console.log('❌ No cloned organizations found');
      return;
    }

    const latestClonedOrg = orgs[0];
    console.log(`\n📋 Checking inventory in: ${latestClonedOrg.name} (${latestClonedOrg.id})`);
    
    // Check if cloned org has pricing plans
    const { data: clonedPricingPlans } = await supabase
      .from('pricingplan')
      .select('id')
      .eq('organization_id', latestClonedOrg.id);
      
    console.log(`Cloned pricing plans: ${clonedPricingPlans?.length || 0}`);
    
    if (!clonedPricingPlans || clonedPricingPlans.length === 0) {
      console.log('❌ No pricing plans found in cloned org');
      return;
    }
    
    // Check inventory items in the cloned organization
    const { data: clonedInventory } = await supabase
      .from('inventory')
      .select('*')
      .in('pricing_plan_id', clonedPricingPlans.map(p => p.id));
      
    console.log(`✅ Inventory items found: ${clonedInventory?.length || 0}`);
    
    if (clonedInventory && clonedInventory.length > 0) {
      console.log('Sample cloned inventory items:');
      clonedInventory.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. Quantity: ${item.quantity}, Status: ${item.status}, Plan ID: ${item.pricing_plan_id.substring(0, 8)}...`);
      });
      
      // Check if all have quantity = 100
      const quantity100Count = clonedInventory.filter(item => item.quantity === 100).length;
      console.log(`Items with quantity = 100: ${quantity100Count}/${clonedInventory.length}`);
      
      if (quantity100Count === clonedInventory.length) {
        console.log('✅ All inventory items have quantity = 100 as expected!');
      } else {
        console.log('⚠️ Some inventory items do not have quantity = 100');
      }
    } else {
      console.log('❌ No inventory items found in cloned organization');
      console.log('This means inventory cloning may not be working yet or no inventory exists in source');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInventoryCloning();
