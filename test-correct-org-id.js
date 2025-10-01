// Test cloning with the CORRECT source organization ID
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWithCorrectOrgId() {
  console.log('🎯 Testing Cloning with Correct Organization ID\n');

  const correctSourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891'; // Actual metexam ID
  const cloneName = 'correct-id-test';

  try {
    // 1. Create the cloned organization
    console.log('1️⃣  Creating cloned organization...');
    const { data: clonedOrg, error: cloneError } = await supabase
      .from('organizations')
      .insert([{
        name: cloneName,
        type: 'customer',
        base_url: `${cloneName}.example.com`,
        created_by_email: 'test@correct.com'
      }])
      .select()
      .single();

    if (cloneError || !clonedOrg) {
      console.log('❌ Failed to create organization:', cloneError?.message);
      return;
    }

    console.log('✅ Organization created:', clonedOrg.id);

    // 2. Clone product sub-types
    console.log('2️⃣  Cloning product sub-types...');
    const { data: sourceProductSubTypes, error: productSubTypesError } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', correctSourceOrgId);

    console.log(`   Found ${sourceProductSubTypes?.length || 0} product sub-types`);

    let productSubTypeIdMapping = {};
    if (sourceProductSubTypes && sourceProductSubTypes.length > 0) {
      const productSubTypesToInsert = sourceProductSubTypes.map(subType => {
        const { id, ...subTypeWithoutId } = subType;
        return {
          ...subTypeWithoutId,
          organization_id: clonedOrg.id,
        };
      });

      const { data: clonedProductSubTypes, error: cloneSubTypesError } = await supabase
        .from('product_sub_type')
        .insert(productSubTypesToInsert)
        .select('id');

      if (cloneSubTypesError) {
        console.log('❌ Product sub-types failed:', cloneSubTypesError.message);
        return;
      }

      // Create ID mapping
      sourceProductSubTypes.forEach((originalSubType, index) => {
        productSubTypeIdMapping[originalSubType.id] = clonedProductSubTypes[index].id;
      });

      console.log(`✅ Product sub-types cloned: ${clonedProductSubTypes.length}`);
    }

    // 3. Clone products
    console.log('3️⃣  Cloning products...');
    const { data: sourceProducts, error: productsError } = await supabase
      .from('product')
      .select('*')
      .eq('organization_id', correctSourceOrgId);

    console.log(`   Found ${sourceProducts?.length || 0} products`);

    if (sourceProducts && sourceProducts.length > 0 && !productsError) {
      let successfulProducts = 0;
      let failedProducts = 0;

      for (const product of sourceProducts.slice(0, 5)) { // Test just first 5
        try {
          const { id, stripe_product_id, ...productWithoutId } = product;
          
          let productData = {
            ...productWithoutId,
            organization_id: clonedOrg.id,
            stripe_product_id: null,
            product_sub_type_id: productSubTypeIdMapping[product.product_sub_type_id] || product.product_sub_type_id,
          };

          // Handle invalid foreign keys
          if (product.course_connected_id) {
            const { data: courseExists } = await supabase
              .from('course')
              .select('id')
              .eq('id', product.course_connected_id)
              .eq('organization_id', correctSourceOrgId)
              .single();
            
            if (!courseExists) {
              productData.course_connected_id = null;
            }
          }

          if (product.quiz_id) {
            const { data: quizExists } = await supabase
              .from('quiz')
              .select('id')
              .eq('id', product.quiz_id)
              .eq('organization_id', correctSourceOrgId)
              .single();
            
            if (!quizExists) {
              productData.quiz_id = null;
            }
          }

          const { error: cloneProductError } = await supabase
            .from('product')
            .insert([productData]);

          if (cloneProductError) {
            console.log(`   ❌ "${product.product_name}":`, cloneProductError.message);
            failedProducts++;
          } else {
            console.log(`   ✅ "${product.product_name}" cloned`);
            successfulProducts++;
          }

        } catch (productError) {
          console.log(`   ❌ "${product.product_name}":`, productError.message);
          failedProducts++;
        }
      }

      console.log(`\n📊 Results: ${successfulProducts}/${Math.min(5, sourceProducts.length)} products cloned successfully`);
      
      if (successfulProducts > 0) {
        console.log('\n🎉 SUCCESS: Cloning works with correct organization ID!');
        console.log('💡 The issue was using the wrong source organization ID in the API calls');
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  console.log('\n🏁 Test complete');
}

testWithCorrectOrgId();
