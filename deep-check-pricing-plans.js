// Deep check of pricing plan product relationships
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deepCheckPricingPlans() {
  console.log('🔍 Deep Check: Pricing Plan -> Product Relationships\n');

  // Get the most recent cloned organization
  const { data: recentClone } = await supabase
    .from('organizations')
    .select('*')
    .eq('type', 'education')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log(`🎯 Checking: ${recentClone.name} (${recentClone.id})`);

  // Get all products from this cloned organization
  const { data: clonedProducts } = await supabase
    .from('product')
    .select('id, product_name')
    .eq('organization_id', recentClone.id);

  console.log(`\n📊 Cloned Organization has ${clonedProducts?.length || 0} products`);

  // Get all pricing plans from this cloned organization
  const { data: clonedPricingPlans } = await supabase
    .from('pricingplan')
    .select('id, product_id, price, package')
    .eq('organization_id', recentClone.id);

  console.log(`💰 Cloned Organization has ${clonedPricingPlans?.length || 0} pricing plans`);

  if (clonedPricingPlans && clonedPricingPlans.length > 0) {
    console.log('\n🔍 Checking each pricing plan:');
    
    for (const plan of clonedPricingPlans) {
      const productExists = clonedProducts?.find(p => p.id === plan.product_id);
      const status = productExists ? '✅ Connected' : '❌ Broken Link';
      
      console.log(`   Plan ID: ${plan.id} -> product_id: ${plan.product_id} ${status}`);
      if (productExists) {
        console.log(`     -> "${productExists.product_name}"`);
      } else {
        // Check if this product_id belongs to a different organization
        const { data: originalProduct } = await supabase
          .from('product')
          .select('id, product_name, organization_id, organizations(name)')
          .eq('id', plan.product_id)
          .single();
          
        if (originalProduct) {
          console.log(`     -> Points to product in different org: ${originalProduct.organizations?.name || originalProduct.organization_id}`);
          console.log(`     -> Product: "${originalProduct.product_name}"`);
        } else {
          console.log(`     -> Product ID ${plan.product_id} doesn't exist anywhere`);
        }
      }
    }
  }

  // Now check the source organization to understand the mapping needed
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  const { data: sourceProducts } = await supabase
    .from('product')
    .select('id, product_name')
    .eq('organization_id', sourceOrgId);

  const { data: sourcePricingPlans } = await supabase
    .from('pricingplan')
    .select('id, product_id, price, package')
    .eq('organization_id', sourceOrgId);

  console.log(`\n📋 Source Organization:
   Products: ${sourceProducts?.length || 0}
   Pricing Plans: ${sourcePricingPlans?.length || 0}`);

  // Show which products have pricing plans in source
  if (sourcePricingPlans && sourceProducts) {
    console.log('\n🎯 Source Product -> Pricing Plan relationships:');
    const productsWithPlans = new Set();
    
    sourcePricingPlans.forEach(plan => {
      const product = sourceProducts.find(p => p.id === plan.product_id);
      if (product) {
        productsWithPlans.add(product.id);
        console.log(`   "${product.product_name}" (ID: ${product.id}) has pricing plans`);
      }
    });
    
    console.log(`\n📊 Summary: ${productsWithPlans.size}/${sourceProducts.length} source products have pricing plans`);
  }
}

deepCheckPricingPlans();
