require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testActualProductInsertion() {
  console.log('🧪 Testing Actual Product Insertion');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Get a test organization
    const { data: recentOrgs } = await supabase
      .from('organizations')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(2);

    const testOrg = recentOrgs?.find(org => org.id !== sourceOrgId);
    if (!testOrg) {
      console.log('❌ No test organization found');
      return;
    }

    console.log('Using test org:', testOrg.name, testOrg.id);

    // Get product sub-types from test org for mapping
    const { data: testOrgSubTypes } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', testOrg.id);

    console.log('Test org product sub-types:', testOrgSubTypes?.length || 0);

    if (!testOrgSubTypes || testOrgSubTypes.length === 0) {
      console.log('❌ Test org has no product sub-types - this is the problem!');
      return;
    }

    // Get source products and create mapping
    const { data: sourceProducts } = await supabase
      .from('product')
      .select('*')
      .eq('organization_id', sourceOrgId)
      .limit(1);

    const { data: sourceSubTypes } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', sourceOrgId);

    if (sourceProducts && sourceProducts.length > 0 && sourceSubTypes) {
      // Create mapping
      let productSubTypeIdMapping = {};
      sourceSubTypes.forEach((sourceSubType, index) => {
        if (testOrgSubTypes[index]) {
          productSubTypeIdMapping[sourceSubType.id] = testOrgSubTypes[index].id;
        }
      });

      console.log('Created mapping sample:', Object.fromEntries(Object.entries(productSubTypeIdMapping).slice(0, 3)));

      const product = sourceProducts[0];
      const { id, stripe_product_id, ...productWithoutId } = product;
      
      const productData = {
        ...productWithoutId,
        organization_id: testOrg.id,
        stripe_product_id: null,
        product_sub_type_id: productSubTypeIdMapping[product.product_sub_type_id] || product.product_sub_type_id,
        course_connected_id: product.course_connected_id ? null : product.course_connected_id, // Set to null since courses don't exist
        quiz_id: product.quiz_id ? null : product.quiz_id, // Set to null since quizzes don't exist
      };

      console.log('\nTesting product insertion:');
      console.log('Product data to insert:', {
        product_name: productData.product_name,
        organization_id: productData.organization_id,
        product_sub_type_id: productData.product_sub_type_id,
        course_connected_id: productData.course_connected_id,
        quiz_id: productData.quiz_id,
        stripe_product_id: productData.stripe_product_id
      });

      // Test actual insertion
      const { data: insertedProduct, error: insertError } = await supabase
        .from('product')
        .insert([productData])
        .select();

      if (insertError) {
        console.error('❌ Product insertion failed:', insertError.message);
        console.error('Full error:', insertError);
      } else {
        console.log('✅ Product insertion successful!');
        console.log('Inserted product:', insertedProduct[0].product_name);
        
        // Clean up
        await supabase
          .from('product')
          .delete()
          .eq('id', insertedProduct[0].id);
        console.log('🧹 Test product cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testActualProductInsertion();
