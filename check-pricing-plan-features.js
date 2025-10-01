// Check pricing plan features structure and duplicates
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPricingPlanFeatures() {
  console.log('🔍 Checking Pricing Plan Features Structure\n');

  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891'; // metexam

  // Get source pricing plan features
  const { data: sourcePricingPlanFeatures } = await supabase
    .from('pricingplan_features')
    .select(`
      *,
      feature:feature_id (organization_id, name),
      pricingplan:pricingplan_id (organization_id)
    `)
    .eq('feature.organization_id', sourceOrgId);

  console.log(`📊 Total pricing plan features: ${sourcePricingPlanFeatures?.length || 0}`);

  if (sourcePricingPlanFeatures && sourcePricingPlanFeatures.length > 0) {
    // Check for duplicates in source data
    const combinations = new Set();
    const duplicates = [];
    
    sourcePricingPlanFeatures.forEach(pf => {
      const combo = `${pf.pricingplan_id}-${pf.feature_id}`;
      if (combinations.has(combo)) {
        duplicates.push({ pricingplan_id: pf.pricingplan_id, feature_id: pf.feature_id, combo });
      }
      combinations.add(combo);
    });

    console.log(`📋 Unique combinations: ${combinations.size}`);
    console.log(`🔄 Duplicate combinations: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  Found duplicates in source data:');
      duplicates.slice(0, 3).forEach(dup => {
        console.log(`   Pricing Plan ${dup.pricingplan_id} + Feature ${dup.feature_id}`);
      });
    }

    // Show sample data structure
    console.log('\n📋 Sample pricing plan features:');
    sourcePricingPlanFeatures.slice(0, 5).forEach((pf, i) => {
      console.log(`   ${i+1}. Plan: ${pf.pricingplan_id}, Feature: ${pf.feature_id} ("${pf.feature?.name || 'unknown'}")`);
    });

    // Check if features and pricing plans exist for the same organization
    const planOrgCheck = sourcePricingPlanFeatures.filter(pf => 
      pf.pricingplan?.organization_id !== sourceOrgId
    );
    
    console.log(`\n🔍 Pricing plans from other orgs: ${planOrgCheck.length}`);
    if (planOrgCheck.length > 0) {
      console.log('⚠️  Some pricing plans belong to different organizations');
    }
  }

  // Check the constraint
  console.log('\n🔍 Checking table constraints...');
  const { data: constraints } = await supabase
    .rpc('get_table_constraints', { table_name: 'pricingplan_features' })
    .single();

  // Alternative: check via information schema
  const { data: tableInfo } = await supabase
    .from('information_schema.table_constraints')
    .select('constraint_name, constraint_type')
    .eq('table_name', 'pricingplan_features')
    .eq('table_schema', 'public');

  if (tableInfo) {
    console.log('📋 Table constraints:');
    tableInfo.forEach(constraint => {
      console.log(`   ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
  }
}

checkPricingPlanFeatures();
