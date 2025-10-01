// Check if we're using the correct source organization ID
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSourceOrganization() {
  console.log('🔍 Checking Source Organization Data\n');

  // Check if metexam organization exists and get its ID
  const { data: metexamOrgs, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'metexam');

  console.log('📋 Organizations named "metexam":');
  if (metexamOrgs && metexamOrgs.length > 0) {
    metexamOrgs.forEach((org, i) => {
      console.log(`   ${i+1}. ID: ${org.id}`);
      console.log(`      Name: ${org.name}`);
      console.log(`      Type: ${org.type}`);
      console.log(`      Created: ${org.created_at}`);
      console.log('');
    });
  } else {
    console.log('   ❌ No organizations found with name "metexam"');
    console.log('   Error:', orgError?.message || 'none');
  }

  // Check a few organizations to see which one has products
  console.log('🔍 Checking organizations for products...');
  const { data: allOrgs } = await supabase
    .from('organizations')
    .select('id, name, type')
    .limit(10);

  if (allOrgs) {
    for (const org of allOrgs) {
      const { count: productCount } = await supabase
        .from('product')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id);

      const { count: subTypeCount } = await supabase
        .from('product_sub_type')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id);

      if (productCount > 0 || subTypeCount > 0) {
        console.log(`📊 ${org.name} (${org.type}) - ID: ${org.id}`);
        console.log(`   Products: ${productCount}, Sub-types: ${subTypeCount}`);
      }
    }
  }

  // Try the original ID we were using
  const testOrgId = 'b8cf89ba-de99-4a5c-acfb-15050cfb069a';
  console.log(`\n🎯 Testing original org ID: ${testOrgId}`);
  
  const { data: testOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', testOrgId)
    .single();

  if (testOrg) {
    console.log(`   ✅ Organization found: ${testOrg.name} (${testOrg.type})`);
    
    const { count: productCount } = await supabase
      .from('product')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', testOrgId);

    const { count: subTypeCount } = await supabase
      .from('product_sub_type')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', testOrgId);

    console.log(`   Products: ${productCount}, Sub-types: ${subTypeCount}`);
  } else {
    console.log('   ❌ Organization not found with that ID');
  }
}

checkSourceOrganization();
