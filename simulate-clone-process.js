require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulateCloneProcess() {
  console.log('🧪 Simulating Clone Process Step by Step');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  const mockClonedOrgId = '12345678-1234-1234-1234-123456789012';
  
  try {
    console.log('Step 1: Product Sub-Types Cloning');
    const { data: sourceProductSubTypes, error: productSubTypesError } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', sourceOrgId);

    console.log('Source product sub-types found:', sourceProductSubTypes?.length || 0);

    let productSubTypeIdMapping = {};
    if (sourceProductSubTypes && sourceProductSubTypes.length > 0 && !productSubTypesError) {
      console.log('✅ Product sub-types ready for cloning');
      
      // Simulate mapping creation (don't actually clone)
      sourceProductSubTypes.forEach((subType, index) => {
        productSubTypeIdMapping[subType.id] = 5000 + index; // Simulate new IDs
      });
      console.log('Simulated mapping created:', Object.fromEntries(Object.entries(productSubTypeIdMapping).slice(0, 3)));
    } else {
      console.log('❌ Product sub-types issue:', productSubTypesError?.message);
    }

    console.log('\nStep 2: Products Cloning');
    const { data: sourceProducts, error: productsError } = await supabase
      .from('product')
      .select('*')
      .eq('organization_id', sourceOrgId);

    console.log('Source products found:', sourceProducts?.length || 0, 'Error:', productsError?.message);

    if (sourceProducts && sourceProducts.length > 0 && !productsError) {
      console.log('✅ Products data available for cloning');
      
      let successfulProducts = 0;
      let failedProducts = 0;

      console.log('\nProcessing products:');
      for (const product of sourceProducts.slice(0, 3)) { // Just test first 3
        try {
          const { id, stripe_product_id, ...productWithoutId } = product;
          
          const productData = {
            ...productWithoutId,
            organization_id: mockClonedOrgId,
            stripe_product_id: null,
            product_sub_type_id: productSubTypeIdMapping[product.product_sub_type_id] || product.product_sub_type_id,
          };

          // Handle course references
          if (product.course_connected_id) {
            console.log(`   Checking course ${product.course_connected_id}...`);
            const { data: courseExists } = await supabase
              .from('course')
              .select('id')
              .eq('id', product.course_connected_id)
              .eq('organization_id', sourceOrgId)
              .single();
            
            if (!courseExists) {
              console.log(`   Course ${product.course_connected_id} not found, setting to null`);
              productData.course_connected_id = null;
            } else {
              console.log(`   Course ${product.course_connected_id} exists`);
            }
          }

          // Handle quiz references
          if (product.quiz_id) {
            console.log(`   Checking quiz ${product.quiz_id}...`);
            const { data: quizExists } = await supabase
              .from('quiz')
              .select('id')
              .eq('id', product.quiz_id)
              .eq('organization_id', sourceOrgId)
              .single();
            
            if (!quizExists) {
              console.log(`   Quiz ${product.quiz_id} not found, setting to null`);
              productData.quiz_id = null;
            } else {
              console.log(`   Quiz ${product.quiz_id} exists`);
            }
          }

          console.log(`   Product "${product.product_name}" processed successfully`);
          successfulProducts++;

        } catch (productError) {
          console.error(`   Error processing "${product.product_name}":`, productError.message);
          failedProducts++;
        }
      }

      console.log(`\nResults: ${successfulProducts}/${sourceProducts.slice(0, 3).length} successful (simulated)`);
      
      if (successfulProducts > 0) {
        console.log('✅ Product cloning logic should work');
      } else {
        console.log('❌ Product cloning logic has issues');
      }
    } else {
      console.log('❌ No source products or error:', productsError?.message);
    }

  } catch (error) {
    console.error('❌ Simulation error:', error.message);
  }
}

simulateCloneProcess();
