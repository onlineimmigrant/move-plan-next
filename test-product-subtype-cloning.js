require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testProductSubTypeCloning() {
  console.log('🧪 Testing Product Sub-Type Cloning Logic');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  const testOrgId = 'test-org-' + Date.now();
  
  try {
    console.log('1. Testing product sub-type cloning...');
    
    // Get source product sub-types
    const { data: sourceProductSubTypes, error: productSubTypesError } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', sourceOrgId);

    console.log('Source product sub-types found:', sourceProductSubTypes?.length || 0);
    console.log('Error:', productSubTypesError?.message);

    if (sourceProductSubTypes && sourceProductSubTypes.length > 0) {
      console.log('Sample product sub-type to clone:');
      const sample = sourceProductSubTypes[0];
      console.log('Original:', sample);
      
      // Test cloning logic
      const { id, ...subTypeWithoutId } = sample;
      const testSubType = {
        ...subTypeWithoutId,
        organization_id: testOrgId,
      };
      console.log('Would insert:', testSubType);

      // Test actual insertion (we'll delete it after)
      console.log('\n2. Testing actual insertion...');
      const { data: insertedSubType, error: insertError } = await supabase
        .from('product_sub_type')
        .insert([testSubType])
        .select();

      if (insertError) {
        console.error('❌ Insertion failed:', insertError.message);
        console.error('Full error:', insertError);
      } else {
        console.log('✅ Insertion successful:', insertedSubType);
        
        // Clean up - delete the test record
        await supabase
          .from('product_sub_type')
          .delete()
          .eq('id', insertedSubType[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }

    // Test why recent clones don't have product sub-types
    console.log('\n3. Checking recent clone organizations...');
    const { data: recentOrgs } = await supabase
      .from('organizations')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(3);

    for (const org of recentOrgs || []) {
      if (org.id === sourceOrgId) continue;
      
      const { data: subTypes } = await supabase
        .from('product_sub_type')
        .select('id, name')
        .eq('organization_id', org.id);
        
      console.log(`   ${org.name}: ${subTypes?.length || 0} product sub-types`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testProductSubTypeCloning();
