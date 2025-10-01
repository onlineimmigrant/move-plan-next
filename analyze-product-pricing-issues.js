require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeProductAndPricingPlanCloning() {
  console.log('🔍 Analyzing Product and Pricing Plan Cloning Issues');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Check recent cloned organizations
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('\n1. Recent organizations:');
    organizations?.forEach((org, index) => {
      const isSource = org.id === sourceOrgId;
      console.log(`${index + 1}. ${org.name} (${org.id.slice(0, 8)}...) ${isSource ? '← SOURCE' : ''}`);
    });

    // Check products in each organization
    console.log('\n2. Products analysis:');
    for (const org of organizations || []) {
      const { data: products } = await supabase
        .from('product')
        .select('id, product_name, organization_id')
        .eq('organization_id', org.id);

      console.log(`   ${org.name}: ${products?.length || 0} products`);
      
      if (products && products.length > 0 && org.id !== sourceOrgId) {
        console.log(`     Sample: "${products[0].product_name}"`);
      }
    }

    // Check pricing plans in each organization
    console.log('\n3. Pricing plans analysis:');
    for (const org of organizations || []) {
      const { data: pricingPlans } = await supabase
        .from('pricingplan')
        .select('id, name, organization_id')
        .eq('organization_id', org.id);

      console.log(`   ${org.name}: ${pricingPlans?.length || 0} pricing plans`);
      
      if (pricingPlans && pricingPlans.length > 0 && org.id !== sourceOrgId) {
        console.log(`     Sample: "${pricingPlans[0].name}"`);
      }
    }

    // Check source data
    console.log('\n4. Source organization data:');
    const { data: sourceProducts } = await supabase
      .from('product')
      .select('id, product_name, product_sub_type_id, course_connected_id, quiz_id')
      .eq('organization_id', sourceOrgId);

    console.log(`   Products: ${sourceProducts?.length || 0}`);
    if (sourceProducts && sourceProducts.length > 0) {
      const sample = sourceProducts[0];
      console.log(`   Sample product: "${sample.product_name}"`);
      console.log(`     - product_sub_type_id: ${sample.product_sub_type_id}`);
      console.log(`     - course_connected_id: ${sample.course_connected_id}`);
      console.log(`     - quiz_id: ${sample.quiz_id}`);
    }

    const { data: sourcePricingPlans } = await supabase
      .from('pricingplan')
      .select('id, name')
      .eq('organization_id', sourceOrgId);

    console.log(`   Pricing plans: ${sourcePricingPlans?.length || 0}`);
    if (sourcePricingPlans && sourcePricingPlans.length > 0) {
      console.log(`   Sample: "${sourcePricingPlans[0].name}"`);
    }

    // Check if product_sub_type table exists and has data
    console.log('\n5. Product sub-types analysis:');
    const { data: productSubTypes } = await supabase
      .from('product_sub_type')
      .select('id, name, organization_id')
      .eq('organization_id', sourceOrgId);

    console.log(`   Source product sub-types: ${productSubTypes?.length || 0}`);
    if (productSubTypes && productSubTypes.length > 0) {
      productSubTypes.forEach((subType, index) => {
        console.log(`   ${index + 1}. ID: ${subType.id}, Name: "${subType.name}"`);
      });
    }

    // Check for cloned product sub-types
    console.log('\n6. Cloned product sub-types analysis:');
    for (const org of organizations || []) {
      if (org.id === sourceOrgId) continue;
      
      const { data: clonedSubTypes } = await supabase
        .from('product_sub_type')
        .select('id, name')
        .eq('organization_id', org.id);

      console.log(`   ${org.name}: ${clonedSubTypes?.length || 0} product sub-types`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeProductAndPricingPlanCloning();
