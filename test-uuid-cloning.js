require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWithProperUUID() {
  console.log('🧪 Testing Product Sub-Type Cloning with Proper UUID');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Get a recent cloned organization ID (should be proper UUID)
    const { data: recentOrgs } = await supabase
      .from('organizations')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(2);

    const testOrgId = recentOrgs?.find(org => org.id !== sourceOrgId)?.id;
    console.log('Using test org ID:', testOrgId);

    if (!testOrgId) {
      console.log('❌ No cloned organization found to test with');
      return;
    }

    // Get source product sub-types
    const { data: sourceProductSubTypes } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', sourceOrgId)
      .limit(1);

    if (sourceProductSubTypes && sourceProductSubTypes.length > 0) {
      const sample = sourceProductSubTypes[0];
      const { id, ...subTypeWithoutId } = sample;
      const testSubType = {
        ...subTypeWithoutId,
        organization_id: testOrgId, // Use proper UUID
      };

      console.log('Testing insertion with proper UUID...');
      const { data: insertedSubType, error: insertError } = await supabase
        .from('product_sub_type')
        .insert([testSubType])
        .select();

      if (insertError) {
        console.error('❌ Still failed:', insertError.message);
        console.error('Full error:', insertError);
      } else {
        console.log('✅ Insertion successful with proper UUID!');
        console.log('Inserted:', insertedSubType[0]);
        
        // Clean up
        await supabase
          .from('product_sub_type')
          .delete()
          .eq('id', insertedSubType[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }

    // Check if there are any constraint issues
    console.log('\n🔍 Checking for potential constraint violations...');
    
    // Check if slug needs to be unique
    const { data: existingSlugs } = await supabase
      .from('product_sub_type')
      .select('slug')
      .eq('slug', 'free-product');
    
    console.log('Existing records with slug "free-product":', existingSlugs?.length || 0);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testWithProperUUID();
