// Test the pricing plan features fix
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPricingPlanFeaturesFix() {
  console.log('🧪 Testing Pricing Plan Features Fix\n');

  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891'; // correct metexam ID
  const testName = 'features-fix-test';

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

    // 2. Clone features first
    console.log('2️⃣  Cloning features...');
    const { data: sourceFeatures } = await supabase
      .from('feature')
      .select('*')
      .eq('organization_id', sourceOrgId);

    const featuresToInsert = sourceFeatures.map(feature => {
      const { id, ...featureWithoutId } = feature;
      return { ...featureWithoutId, organization_id: testOrg.id };
    });

    const { data: clonedFeatures } = await supabase
      .from('feature')
      .insert(featuresToInsert)
      .select('id, name');

    const featureIdMapping = {};
    sourceFeatures.forEach((original, index) => {
      featureIdMapping[original.id] = clonedFeatures[index].id;
    });

    console.log('✅ Features cloned:', clonedFeatures.length);
    console.log('📋 Sample features:');
    clonedFeatures.slice(0, 3).forEach((f, i) => {
      console.log(`   ${i+1}. "${f.name}" (ID: ${f.id})`);
    });

    // 3. Clone product sub-types
    console.log('3️⃣  Cloning product sub-types...');
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

    // 4. Clone products
    console.log('4️⃣  Cloning products...');
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
        course_connected_id: null,
        quiz_id: null
      };
    });

    const { data: clonedProducts } = await supabase
      .from('product')
      .insert(productsToInsert)
      .select('id');

    const productIdMapping = {};
    sourceProducts.forEach((original, index) => {
      productIdMapping[original.id] = clonedProducts[index].id;
    });

    console.log('✅ Products cloned:', clonedProducts.length);

    // 5. Clone pricing plans
    console.log('5️⃣  Cloning pricing plans...');
    const { data: sourcePricingPlans } = await supabase
      .from('pricingplan')
      .select('*')
      .eq('organization_id', sourceOrgId);

    const pricingPlansToInsert = sourcePricingPlans.map(plan => {
      const { id, stripe_price_id, ...planWithoutId } = plan;
      return {
        ...planWithoutId,
        organization_id: testOrg.id,
        stripe_price_id: null,
        product_id: productIdMapping[plan.product_id] || plan.product_id
      };
    });

    const { data: clonedPricingPlans } = await supabase
      .from('pricingplan')
      .insert(pricingPlansToInsert)
      .select('id');

    const pricingPlanIdMapping = {};
    sourcePricingPlans.forEach((original, index) => {
      pricingPlanIdMapping[original.id] = clonedPricingPlans[index].id;
    });

    console.log('✅ Pricing plans cloned:', clonedPricingPlans.length);

    // 6. Clone pricing plan features with both ID mappings
    console.log('6️⃣  Cloning pricing plan features...');
    const { data: sourcePricingPlanFeatures } = await supabase
      .from('pricingplan_features')
      .select(`
        *,
        feature:feature_id (organization_id)
      `)
      .eq('feature.organization_id', sourceOrgId);

    let updatedPricingPlanIds = 0;
    let updatedFeatureIds = 0;

    const pricingPlanFeaturesToInsert = sourcePricingPlanFeatures.map(pf => {
      const { id, feature: featureData, ...pfWithoutId } = pf;
      
      const newPricingPlanId = pricingPlanIdMapping[pf.pricingplan_id];
      const newFeatureId = featureIdMapping[pf.feature_id];
      
      if (newPricingPlanId && newPricingPlanId !== pf.pricingplan_id) {
        updatedPricingPlanIds++;
      }
      if (newFeatureId && newFeatureId !== pf.feature_id) {
        updatedFeatureIds++;
      }
      
      return {
        ...pfWithoutId,
        pricingplan_id: newPricingPlanId || pf.pricingplan_id,
        feature_id: newFeatureId || pf.feature_id,
      };
    });

    console.log(`🔄 Updating ${updatedPricingPlanIds}/${sourcePricingPlanFeatures.length} pricing plan references`);
    console.log(`🔄 Updating ${updatedFeatureIds}/${sourcePricingPlanFeatures.length} feature references`);

    const { data: clonedPricingPlanFeatures, error: pfError } = await supabase
      .from('pricingplan_features')
      .insert(pricingPlanFeaturesToInsert)
      .select('id, pricingplan_id, feature_id');

    if (pfError) {
      console.log('❌ Pricing plan features error:', pfError.message);
      return;
    }

    console.log('✅ Pricing plan features cloned:', clonedPricingPlanFeatures.length);

    // 7. Verify the relationships
    console.log('7️⃣  Verifying pricing plan feature relationships...');
    
    let connectedPlanFeatures = 0;
    let brokenPlanFeatures = 0;
    let connectedFeatures = 0;
    let brokenFeatures = 0;

    for (const pf of clonedPricingPlanFeatures.slice(0, 5)) { // Check first 5
      // Check pricing plan connection
      const pricingPlanExists = clonedPricingPlans.find(p => p.id === pf.pricingplan_id);
      if (pricingPlanExists) {
        connectedPlanFeatures++;
      } else {
        brokenPlanFeatures++;
      }

      // Check feature connection  
      const featureExists = clonedFeatures.find(f => f.id === pf.feature_id);
      if (featureExists) {
        connectedFeatures++;
        console.log(`   ✅ Feature "${featureExists.name}" connected to pricing plan`);
      } else {
        brokenFeatures++;
        console.log(`   ❌ Feature ID ${pf.feature_id} not found`);
      }
    }

    console.log(`\n📊 Relationship Check (sample of 5):
   Pricing Plan Connections: ✅ ${connectedPlanFeatures} / ❌ ${brokenPlanFeatures}
   Feature Connections: ✅ ${connectedFeatures} / ❌ ${brokenFeatures}`);

    if (connectedFeatures > 0 && brokenFeatures === 0 && connectedPlanFeatures > 0 && brokenPlanFeatures === 0) {
      console.log('\n🎉 SUCCESS: Pricing plan features fix is working!');
      console.log('💡 Both features and pricing plans are properly connected');
    } else {
      console.log('\n❌ ISSUE: Some relationships are still broken');
    }

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('pricingplan_features').delete().eq('pricingplan_id', 'IN', `(${clonedPricingPlans.map(p => `'${p.id}'`).join(',')})`);
    await supabase.from('pricingplan').delete().eq('organization_id', testOrg.id);
    await supabase.from('product').delete().eq('organization_id', testOrg.id);
    await supabase.from('product_sub_type').delete().eq('organization_id', testOrg.id);
    await supabase.from('feature').delete().eq('organization_id', testOrg.id);
    await supabase.from('organizations').delete().eq('id', testOrg.id);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPricingPlanFeaturesFix();
