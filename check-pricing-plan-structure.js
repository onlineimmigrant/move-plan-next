// Check pricing plan structure to understand the product_id relationship
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPricingPlanStructure() {
  console.log('🔍 Checking Pricing Plan Structure\n');

  // Get the correct metexam organization ID
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  // Check pricing plans from source organization
  const { data: pricingPlans } = await supabase
    .from('pricingplan')
    .select('*')
    .eq('organization_id', sourceOrgId)
    .limit(3);

  console.log('📋 Sample Pricing Plans:');
  if (pricingPlans && pricingPlans.length > 0) {
    pricingPlans.forEach((plan, i) => {
      console.log(`\n${i+1}. Plan: "${plan.name || plan.title}"`);
      console.log('   Fields:', Object.keys(plan));
      if (plan.product_id) {
        console.log(`   🔗 product_id: ${plan.product_id}`);
      }
      if (plan.stripe_price_id) {
        console.log(`   💳 stripe_price_id: ${plan.stripe_price_id}`);
      }
    });
  } else {
    console.log('   ❌ No pricing plans found');
  }

  // Check if there are products with pricing plans
  const { data: products } = await supabase
    .from('product')
    .select(`
      id, 
      product_name, 
      pricing_plans:pricingplan(id, name, product_id)
    `)
    .eq('organization_id', sourceOrgId)
    .limit(5);

  console.log('\n📊 Products with Pricing Plans:');
  if (products) {
    products.forEach(product => {
      if (product.pricing_plans && product.pricing_plans.length > 0) {
        console.log(`\n🎯 Product: "${product.product_name}" (ID: ${product.id})`);
        product.pricing_plans.forEach(plan => {
          console.log(`   - Plan: "${plan.name}" (ID: ${plan.id}) -> product_id: ${plan.product_id}`);
        });
      }
    });
  }

  // Check recent cloned organization to see the issue
  const { data: recentClone } = await supabase
    .from('organizations')
    .select('*')
    .eq('type', 'education')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentClone) {
    console.log(`\n🔍 Recent Clone: ${recentClone.name} (${recentClone.id})`);
    
    const { data: clonedPricingPlans } = await supabase
      .from('pricingplan')
      .select('*, product:product_id(id, product_name)')
      .eq('organization_id', recentClone.id)
      .limit(3);

    console.log('\n📋 Cloned Pricing Plans Issues:');
    if (clonedPricingPlans) {
      clonedPricingPlans.forEach(plan => {
        const productExists = plan.product !== null;
        console.log(`   Plan: "${plan.name}" -> product_id: ${plan.product_id} ${productExists ? '✅' : '❌ (broken link)'}`);
        if (productExists) {
          console.log(`     -> Points to: "${plan.product.product_name}"`);
        }
      });
    }
  }
}

checkPricingPlanStructure();
