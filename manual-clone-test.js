// Manual clone test to bypass API authentication issues
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function manualCloneTest() {
  console.log('🔧 Manual Clone Test - Bypassing API\n');

  const sourceOrgId = 'b8cf89ba-de99-4a5c-acfb-15050cfb069a'; // metexam ID
  const cloneName = 'manual-test-clone';

  try {
    // 1. Create the cloned organization
    console.log('1️⃣  Creating cloned organization...');
    const { data: clonedOrg, error: cloneError } = await supabase
      .from('organizations')
      .insert([{
        name: cloneName,
        type: 'customer',
        base_url: `${cloneName}.example.com`,
        created_by_email: 'test@manual.com'
      }])
      .select()
      .single();

    if (cloneError || !clonedOrg) {
      console.log('❌ Failed to create organization:', cloneError?.message);
      return;
    }

    console.log('✅ Organization created:', clonedOrg.id);

    // 2. Clone product sub-types (dependency for products)
    console.log('2️⃣  Cloning product sub-types...');
    const { data: sourceProductSubTypes, error: productSubTypesError } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', sourceOrgId);

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
      .eq('organization_id', sourceOrgId);

    if (sourceProducts && sourceProducts.length > 0 && !productsError) {
      let successfulProducts = 0;
      let failedProducts = 0;

      for (const product of sourceProducts) {
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
              .eq('organization_id', sourceOrgId)
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
              .eq('organization_id', sourceOrgId)
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
            successfulProducts++;
          }

        } catch (productError) {
          console.log(`   ❌ "${product.product_name}":`, productError.message);
          failedProducts++;
        }
      }

      console.log(`✅ Products cloned: ${successfulProducts}/${sourceProducts.length}`);
      
      if (successfulProducts > 0) {
        console.log('\n🎉 SUCCESS: Manual cloning worked!');
        console.log('💡 This confirms the route logic should work - API issue must be elsewhere');
        
        // Check if products exist in the new org
        const { data: newProducts, count } = await supabase
          .from('product')
          .select('product_name', { count: 'exact' })
          .eq('organization_id', clonedOrg.id)
          .limit(5);
          
        console.log(`📊 Verification: ${count} products found in new organization`);
        if (newProducts) {
          newProducts.forEach((p, i) => console.log(`   ${i+1}. ${p.product_name}`));
        }
      } else {
        console.log('\n❌ FAILED: Manual cloning failed too - data issue');
      }
    }

  } catch (error) {
    console.error('❌ Manual clone error:', error.message);
  }

  console.log('\n🏁 Manual test complete');
}

manualCloneTest();
