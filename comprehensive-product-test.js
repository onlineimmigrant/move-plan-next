// Comprehensive test to diagnose why products aren't being cloned
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function comprehensiveProductTest() {
  console.log('🔬 Comprehensive Product Cloning Diagnosis\n');

  // 1. Check source organization and products
  const { data: sourceOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'metexam')
    .single();

  if (!sourceOrg) {
    console.log('❌ Source organization (metexam) not found');
    return;
  }

  console.log('✅ Source organization found:', sourceOrg.id);

  // 2. Check source products and product sub-types
  const { data: sourceProducts, error: productsError } = await supabase
    .from('product')
    .select('*')
    .eq('organization_id', sourceOrg.id);

  const { data: sourceProductSubTypes, error: productSubTypesError } = await supabase
    .from('product_sub_type')
    .select('*')
    .eq('organization_id', sourceOrg.id);

  console.log(`📊 Source Data:
   Products: ${sourceProducts?.length || 0} (Error: ${productsError?.message || 'none'})
   Product Sub-types: ${sourceProductSubTypes?.length || 0} (Error: ${productSubTypesError?.message || 'none'})`);

  if (!sourceProducts || sourceProducts.length === 0) {
    console.log('❌ No source products to clone');
    return;
  }

  // 3. Create a test organization to clone into
  const testOrgName = `test-diagnosis-${Date.now()}`;
  const { data: testOrg, error: testOrgError } = await supabase
    .from('organizations')
    .insert([{
      name: testOrgName,
      type: 'customer',
      base_url: `${testOrgName}.example.com`,
      created_by_email: 'test@test.com'
    }])
    .select()
    .single();

  if (testOrgError || !testOrg) {
    console.log('❌ Failed to create test organization:', testOrgError?.message);
    return;
  }

  console.log('✅ Test organization created:', testOrg.id);

  try {
    // 4. Test product sub-type cloning first (dependency)
    if (sourceProductSubTypes && sourceProductSubTypes.length > 0) {
      console.log('\n🔄 Testing Product Sub-type Cloning:');
      
      const productSubTypesToInsert = sourceProductSubTypes.map(subType => {
        const { id, ...subTypeWithoutId } = subType;
        return {
          ...subTypeWithoutId,
          organization_id: testOrg.id,
        };
      });

      const { data: clonedProductSubTypes, error: cloneSubTypesError } = await supabase
        .from('product_sub_type')
        .insert(productSubTypesToInsert)
        .select('id');

      if (cloneSubTypesError) {
        console.log('❌ Product sub-types failed:', cloneSubTypesError.message);
        return;
      } else {
        console.log('✅ Product sub-types cloned:', clonedProductSubTypes?.length || 0);
        
        // Create ID mapping
        const productSubTypeIdMapping = {};
        sourceProductSubTypes.forEach((originalSubType, index) => {
          productSubTypeIdMapping[originalSubType.id] = clonedProductSubTypes[index].id;
        });
        console.log('   ID Mapping:', productSubTypeIdMapping);
      
        // 5. Test product cloning with proper mapping
        console.log('\n🔄 Testing Product Cloning:');
        let successfulProducts = 0;
        let failedProducts = 0;

        for (const product of sourceProducts) {
          try {
            const { id, stripe_product_id, ...productWithoutId } = product;
            
            let productData = {
              ...productWithoutId,
              organization_id: testOrg.id,
              stripe_product_id: null,
              product_sub_type_id: productSubTypeIdMapping[product.product_sub_type_id] || product.product_sub_type_id,
            };

            // Check and nullify invalid foreign keys
            if (product.course_connected_id) {
              const { data: courseExists } = await supabase
                .from('course')
                .select('id')
                .eq('id', product.course_connected_id)
                .eq('organization_id', sourceOrg.id)
                .single();
              
              if (!courseExists) {
                console.log(`   ⚠️  Course ${product.course_connected_id} not found, setting to null`);
                productData.course_connected_id = null;
              }
            }

            if (product.quiz_id) {
              const { data: quizExists } = await supabase
                .from('quiz')
                .select('id')
                .eq('id', product.quiz_id)
                .eq('organization_id', sourceOrg.id)
                .single();
              
              if (!quizExists) {
                console.log(`   ⚠️  Quiz ${product.quiz_id} not found, setting to null`);
                productData.quiz_id = null;
              }
            }

            const { error: cloneProductError } = await supabase
              .from('product')
              .insert([productData]);

            if (cloneProductError) {
              console.log(`   ❌ Product "${product.product_name}" failed:`, cloneProductError.message);
              failedProducts++;
            } else {
              console.log(`   ✅ Product "${product.product_name}" cloned successfully`);
              successfulProducts++;
            }

          } catch (productError) {
            console.log(`   ❌ Product "${product.product_name}" error:`, productError.message);
            failedProducts++;
          }
        }

        console.log(`\n📊 Product Cloning Results: ${successfulProducts}/${sourceProducts.length} successful`);
        
        if (successfulProducts > 0) {
          console.log('🎉 SUCCESS: Product cloning logic is working!');
          console.log('💡 Issue must be in the route execution or API call flow');
        } else {
          console.log('❌ FAILURE: Product cloning logic has issues');
          console.log('🔍 Check constraint violations or data issues');
        }
      }
    }

  } finally {
    // Clean up test organization
    console.log('\n🧹 Cleaning up test organization...');
    await supabase.from('product').delete().eq('organization_id', testOrg.id);
    await supabase.from('product_sub_type').delete().eq('organization_id', testOrg.id);
    await supabase.from('organizations').delete().eq('id', testOrg.id);
    console.log('✅ Cleanup complete');
  }
}

comprehensiveProductTest().catch(console.error);
