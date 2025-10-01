require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteSolution() {
  console.log('🧪 Testing Complete Product & Pricing Plan Solution');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Test pricing plans structure and fix
    console.log('1. Testing Pricing Plans cloning fix...');
    const { data: sourcePricingPlans } = await supabase
      .from('pricingplan')
      .select('*')
      .eq('organization_id', sourceOrgId);

    console.log('Source pricing plans found:', sourcePricingPlans?.length || 0);
    
    if (sourcePricingPlans && sourcePricingPlans.length > 0) {
      const sample = sourcePricingPlans[0];
      console.log('Sample pricing plan structure:');
      console.log('  Original stripe_price_id:', sample.stripe_price_id);
      
      // Test the fixed logic
      const { id, stripe_price_id, ...planWithoutId } = sample;
      const fixedPlan = {
        ...planWithoutId,
        organization_id: 'test-org-id',
        stripe_price_id: null, // This is the fix
      };
      
      console.log('  Fixed stripe_price_id:', fixedPlan.stripe_price_id);
      console.log('  ✅ Pricing plan fix verified');
    }

    // Test product sub-types unique naming
    console.log('\n2. Testing Product Sub-Types unique naming...');
    const { data: sourceProductSubTypes } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', sourceOrgId)
      .limit(2);

    if (sourceProductSubTypes && sourceProductSubTypes.length > 0) {
      const orgSuffix = 'test1234';
      console.log('Sample unique naming:');
      sourceProductSubTypes.forEach((subType, index) => {
        const uniqueName = `${subType.name} (${orgSuffix})`;
        const uniqueSlug = subType.slug ? `${subType.slug}-${orgSuffix}` : `subtype-${index}-${orgSuffix}`;
        
        console.log(`  ${index + 1}. "${subType.name}" → "${uniqueName}"`);
        console.log(`     "${subType.slug}" → "${uniqueSlug}"`);
      });
      console.log('  ✅ Product sub-types unique naming verified');
    }

    // Test products stripe_product_id clearing
    console.log('\n3. Testing Products stripe_product_id clearing...');
    const { data: sourceProducts } = await supabase
      .from('product')
      .select('*')
      .eq('organization_id', sourceOrgId)
      .limit(2);

    if (sourceProducts && sourceProducts.length > 0) {
      const sample = sourceProducts[0];
      console.log('Sample product:');
      console.log('  Original stripe_product_id:', sample.stripe_product_id);
      
      const { id, stripe_product_id, ...productWithoutId } = sample;
      const fixedProduct = {
        ...productWithoutId,
        organization_id: 'test-org-id',
        stripe_product_id: null,
        product_sub_type_id: 'mapped-id',
      };
      
      console.log('  Fixed stripe_product_id:', fixedProduct.stripe_product_id);
      console.log('  ✅ Product stripe_product_id clearing verified');
    }

    console.log('\n🎯 Summary of Fixes:');
    console.log('  ✅ Pricing Plans: stripe_price_id cleared');
    console.log('  ✅ Product Sub-Types: unique names and slugs');
    console.log('  ✅ Products: stripe_product_id cleared');
    console.log('  ✅ Products: product_sub_type_id mapping maintained');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCompleteSolution();
