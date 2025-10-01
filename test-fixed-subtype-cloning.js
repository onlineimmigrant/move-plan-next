require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFixedProductSubTypeCloning() {
  console.log('🧪 Testing FIXED Product Sub-Type Cloning');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Get a recent cloned organization ID
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
      .limit(3);

    console.log('Source product sub-types found:', sourceProductSubTypes?.length || 0);

    if (sourceProductSubTypes && sourceProductSubTypes.length > 0) {
      console.log('\n🔧 Testing fixed cloning logic:');
      
      // Simulate the fixed cloning logic
      const orgSuffix = testOrgId.slice(0, 8);
      const productSubTypesToInsert = sourceProductSubTypes.map((subType, index) => {
        const { id, ...subTypeWithoutId } = subType;
        return {
          ...subTypeWithoutId,
          organization_id: testOrgId,
          // Make name and slug unique to avoid constraint violations
          name: `${subType.name} (${orgSuffix})`,
          slug: subType.slug ? `${subType.slug}-${orgSuffix}` : `subtype-${index}-${orgSuffix}`,
        };
      });

      console.log('Sample transformed sub-types:');
      productSubTypesToInsert.forEach((subType, index) => {
        console.log(`${index + 1}. Original name: "${sourceProductSubTypes[index].name}" → New: "${subType.name}"`);
        console.log(`   Original slug: "${sourceProductSubTypes[index].slug}" → New: "${subType.slug}"`);
      });

      // Test actual insertion of first sub-type
      console.log('\n🧪 Testing actual insertion of first sub-type...');
      const { data: insertedSubType, error: insertError } = await supabase
        .from('product_sub_type')
        .insert([productSubTypesToInsert[0]])
        .select();

      if (insertError) {
        console.error('❌ Still failed:', insertError.message);
        console.error('Full error:', insertError);
      } else {
        console.log('✅ Insertion successful with unique names!');
        console.log('Inserted:', {
          id: insertedSubType[0].id,
          name: insertedSubType[0].name,
          slug: insertedSubType[0].slug,
          organization_id: insertedSubType[0].organization_id
        });
        
        // Clean up
        await supabase
          .from('product_sub_type')
          .delete()
          .eq('id', insertedSubType[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testFixedProductSubTypeCloning();
