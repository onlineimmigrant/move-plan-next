// Test the pricing plan fix by creating a new clone
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPricingPlanFix() {
  console.log('🧪 Testing Pricing Plan Fix\n');

  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891'; // correct metexam ID
  const testName = 'pricing-fix-test';

  try {
    // 1. Create test organization
    console.log('1️⃣  Creating test organization...');
    const { data: testOrg, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: testName,
        type: 'education',
        base_url: `${testName}.test.com`,
        created_by_email: 'test@test.com'
      }])
      .select()
      .single();

    if (orgError) {
      console.log('❌ Failed to create organization:', orgError.message);
      return;
    }

    console.log('✅ Test organization created:', testOrg.id);

    // 2. Clone product sub-types first
    console.log('2️⃣  Cloning product sub-types...');
    const { data: sourceSubTypes } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', sourceOrgId);

    const subTypesToInsert = sourceSubTypes.map(subType => {
      const { id, ...subTypeWithoutId } = subType;
      return { ...subTypeWithoutId, organization_id: testOrg.id };
    });

    const { data: clonedSubTypes } = await supabase
      .from('product_sub_type')
      .insert(subTypesToInsert)
      .select('id');

    const subTypeIdMapping = {};
    sourceSubTypes.forEach((original, index) => {
      subTypeIdMapping[original.id] = clonedSubTypes[index].id;
    });

    console.log('✅ Product sub-types cloned:', clonedSubTypes.length);

    // 3. Clone products with ID mapping
    console.log('3️⃣  Cloning products...');
    const { data: sourceProducts } = await supabase
      .from('product')
      .select('*')
      .eq('organization_id', sourceOrgId);

    const productsToInsert = sourceProducts.map(product => {
      const { id, stripe_product_id, ...productWithoutId } = product;
      return {
        ...productWithoutId,
        organization_id: testOrg.id,
        stripe_product_id: null,
        product_sub_type_id: subTypeIdMapping[product.product_sub_type_id] || product.product_sub_type_id,
        course_connected_id: null, // Clear for simplicity
        quiz_id: null
      };
    });

    const { data: clonedProducts } = await supabase
      .from('product')
      .insert(productsToInsert)
      .select('id, product_name');

    const productIdMapping = {};
    sourceProducts.forEach((original, index) => {
      productIdMapping[original.id] = clonedProducts[index].id;
    });

    console.log('✅ Products cloned:', clonedProducts.length);
    console.log('📋 Sample products:');
    clonedProducts.slice(0, 3).forEach((p, i) => {
      console.log(`   ${i+1}. "${p.product_name}" (ID: ${p.id})`);
    });

    // 4. Clone pricing plans with updated product_id references
    console.log('4️⃣  Cloning pricing plans with product ID mapping...');
    const { data: sourcePricingPlans } = await supabase
      .from('pricingplan')
      .select('*')
      .eq('organization_id', sourceOrgId);

    let updatedCount = 0;
    const pricingPlansToInsert = sourcePricingPlans.map(plan => {
      const { id, stripe_price_id, ...planWithoutId } = plan;
      const newProductId = productIdMapping[plan.product_id];
      if (newProductId && newProductId !== plan.product_id) {
        updatedCount++;
      }
      return {
        ...planWithoutId,
        organization_id: testOrg.id,
        stripe_price_id: null,
        product_id: newProductId || plan.product_id
      };
    });

    console.log(`🔄 Updating ${updatedCount}/${sourcePricingPlans.length} pricing plan product references`);

    const { data: clonedPricingPlans, error: pricingError } = await supabase
      .from('pricingplan')
      .insert(pricingPlansToInsert)
      .select('id, product_id, price');

    if (pricingError) {
      console.log('❌ Pricing plan error:', pricingError.message);
      return;
    }

    console.log('✅ Pricing plans cloned:', clonedPricingPlans.length);

    // 5. Verify the relationships
    console.log('5️⃣  Verifying pricing plan -> product relationships...');
    
    let connectedPlans = 0;
    let brokenPlans = 0;

    for (const plan of clonedPricingPlans.slice(0, 5)) { // Check first 5 plans
      const productExists = clonedProducts.find(p => p.id === plan.product_id);
      if (productExists) {
        connectedPlans++;
        console.log(`   ✅ Plan ${plan.id} -> Product "${productExists.product_name}"`);
      } else {
        brokenPlans++;
        console.log(`   ❌ Plan ${plan.id} -> Product ID ${plan.product_id} (not found)`);
      }
    }

    console.log(`\n📊 Relationship Check (sample of 5):
   ✅ Connected: ${connectedPlans}
   ❌ Broken: ${brokenPlans}`);

    if (connectedPlans > 0 && brokenPlans === 0) {
      console.log('\n🎉 SUCCESS: Pricing plan fix is working!');
      console.log('💡 Pricing plans now properly reference cloned products');
    } else if (brokenPlans > 0) {
      console.log('\n❌ ISSUE: Some pricing plans still have broken references');
    }

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('pricingplan').delete().eq('organization_id', testOrg.id);
    await supabase.from('product').delete().eq('organization_id', testOrg.id);
    await supabase.from('product_sub_type').delete().eq('organization_id', testOrg.id);
    await supabase.from('organizations').delete().eq('id', testOrg.id);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPricingPlanFix();
