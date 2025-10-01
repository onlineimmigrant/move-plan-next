const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateInventory() {
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  console.log('🔍 Finding Inventory Items for Source Organization');
  
  try {
    // First get pricing plan IDs from source org
    const { data: pricingPlans, error: plansError } = await supabase
      .from('pricingplan')
      .select('id')
      .eq('organization_id', sourceOrgId);
      
    if (plansError || !pricingPlans || pricingPlans.length === 0) {
      console.log('❌ No pricing plans found for source org:', plansError?.message);
      return;
    }
    
    console.log(`Source org has ${pricingPlans.length} pricing plans`);
    
    // Get inventory items for those pricing plans
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('*')
      .in('pricing_plan_id', pricingPlans.map(p => p.id));
      
    if (inventoryError) {
      console.log('❌ Inventory Error:', inventoryError.message);
      return;
    }
    
    console.log(`✅ Total inventory items found: ${inventory?.length || 0}`);
    
    if (inventory && inventory.length > 0) {
      console.log('Sample inventory items:');
      inventory.slice(0, 5).forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          id: item.id,
          pricing_plan_id: item.pricing_plan_id,
          quantity: item.quantity,
          status: item.status,
          description: item.description
        });
      });
      
      // Show quantities distribution
      const quantities = inventory.map(item => item.quantity);
      console.log('Quantity distribution:', {
        min: Math.min(...quantities),
        max: Math.max(...quantities),
        average: Math.round(quantities.reduce((a, b) => a + b, 0) / quantities.length)
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

investigateInventory();
