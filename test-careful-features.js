// Test with better filtering to avoid cross-organization references
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPricingPlanFeaturesCareful() {
  console.log('🧪 Testing Pricing Plan Features (Careful Filtering)\n');

  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  const testName = 'careful-features-test';

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

    console.log('✅ Test organization created:', testOrg.id);

    // 2. Get source data with organization validation
    console.log('2️⃣  Getting source data...');
    
    const { data: sourceFeatures } = await supabase
      .from('feature')
      .select('*')
      .eq('organization_id', sourceOrgId);

    const { data: sourcePricingPlans } = await supabase
      .from('pricingplan')
      .select('*')
      .eq('organization_id', sourceOrgId);

    // Get only pricingplan_features that belong to our organization's pricing plans
    const sourcePricingPlanIds = sourcePricingPlans.map(p => p.id);
    
    const { data: allPricingPlanFeatures } = await supabase
      .from('pricingplan_features')
      .select(`
        *,
        feature:feature_id (organization_id, name)
      `)
      .in('pricingplan_id', sourcePricingPlanIds);

    // Filter to only include features from our organization
    const sourcePricingPlanFeatures = allPricingPlanFeatures.filter(pf => 
      pf.feature && pf.feature.organization_id === sourceOrgId
    );

    console.log(`📊 Source data:
   Features: ${sourceFeatures.length}
   Pricing Plans: ${sourcePricingPlans.length}
   Pricing Plan Features: ${sourcePricingPlanFeatures.length} (filtered from ${allPricingPlanFeatures.length})`);

    // 3. Clone features
    console.log('3️⃣  Cloning features...');
    const featuresToInsert = sourceFeatures.map(f => {
      const { id, ...fWithoutId } = f;
      return { ...fWithoutId, organization_id: testOrg.id };
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

    // 4. Clone pricing plans (simplified - no product dependencies for this test)
    console.log('4️⃣  Cloning pricing plans...');
    const pricingPlansToInsert = sourcePricingPlans.map(p => {
      const { id, stripe_price_id, ...pWithoutId } = p;
      return {
        ...pWithoutId,
        organization_id: testOrg.id,
        stripe_price_id: null,
        product_id: null // Simplify for this test
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

    // 5. Clone pricing plan features with careful ID validation
    console.log('5️⃣  Cloning pricing plan features...');
    
    let validFeatures = 0;
    let skippedFeatures = 0;

    const pricingPlanFeaturesToInsert = [];
    
    for (const pf of sourcePricingPlanFeatures) {
      const newPricingPlanId = pricingPlanIdMapping[pf.pricingplan_id];
      const newFeatureId = featureIdMapping[pf.feature_id];
      
      if (newPricingPlanId && newFeatureId) {
        const { id, feature, ...pfWithoutId } = pf;
        pricingPlanFeaturesToInsert.push({
          ...pfWithoutId,
          pricingplan_id: newPricingPlanId,
          feature_id: newFeatureId,
        });
        validFeatures++;
      } else {
        console.log(`   ⚠️  Skipping: Plan ${pf.pricingplan_id} (${newPricingPlanId ? 'OK' : 'MISSING'}) + Feature ${pf.feature_id} (${newFeatureId ? 'OK' : 'MISSING'})`);
        skippedFeatures++;
      }
    }

    console.log(`🔄 Processing ${validFeatures} valid features, skipping ${skippedFeatures}`);

    if (pricingPlanFeaturesToInsert.length > 0) {
      const { data: clonedPFFeatures, error: pfError } = await supabase
        .from('pricingplan_features')
        .insert(pricingPlanFeaturesToInsert)
        .select('id, pricingplan_id, feature_id');

      if (pfError) {
        console.log('❌ Pricing plan features error:', pfError.message);
        console.log('🔍 First few features being inserted:');
        pricingPlanFeaturesToInsert.slice(0, 3).forEach((pf, i) => {
          console.log(`   ${i+1}. Plan: ${pf.pricingplan_id}, Feature: ${pf.feature_id}`);
        });
      } else {
        console.log('✅ Pricing plan features cloned:', clonedPFFeatures.length);
        
        // 6. Verify relationships
        console.log('6️⃣  Verifying relationships...');
        let connected = 0;
        for (const pf of clonedPFFeatures.slice(0, 5)) {
          const planExists = clonedPricingPlans.find(p => p.id === pf.pricingplan_id);
          const featureExists = clonedFeatures.find(f => f.id === pf.feature_id);
          
          if (planExists && featureExists) {
            connected++;
            console.log(`   ✅ "${featureExists.name}" connected to pricing plan`);
          }
        }
        
        if (connected === 5) {
          console.log('\n🎉 SUCCESS: All tested relationships are working!');
        }
      }
    }

    // Clean up
    console.log('\n🧹 Cleaning up...');
    await supabase.from('pricingplan_features').delete().eq('pricingplan_id', 'IN', `(${clonedPricingPlans.map(p => `'${p.id}'`).join(',')})`);
    await supabase.from('pricingplan').delete().eq('organization_id', testOrg.id);
    await supabase.from('feature').delete().eq('organization_id', testOrg.id);
    await supabase.from('organizations').delete().eq('id', testOrg.id);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPricingPlanFeaturesCareful();
