require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testProductCloningLogic() {
  console.log('🧪 Testing Product Cloning Logic');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  const testOrgId = 'test-org-id-' + Date.now();
  
  try {
    // Get source products (just first 3 for testing)
    const { data: sourceProducts, error: productsError } = await supabase
      .from('product')
      .select('*')
      .eq('organization_id', sourceOrgId)
      .limit(3);

    console.log('Source products found:', sourceProducts?.length || 0);

    if (sourceProducts && sourceProducts.length > 0) {
      let successfulProducts = 0;
      let failedProducts = 0;

      console.log('\n🔄 Processing products:');
      
      for (let i = 0; i < sourceProducts.length; i++) {
        const product = sourceProducts[i];
        console.log(`\n${i + 1}. Processing: "${product.product_name}"`);
        
        try {
          const { id, stripe_product_id, ...productWithoutId } = product;
          
          let productData = {
            ...productWithoutId,
            organization_id: testOrgId,
            stripe_product_id: null,
          };

          // Check foreign key constraints
          if (product.course_connected_id) {
            console.log(`   Checking course_connected_id: ${product.course_connected_id}`);
            const { data: courseExists } = await supabase
              .from('course')
              .select('id')
              .eq('id', product.course_connected_id)
              .eq('organization_id', sourceOrgId)
              .single();
            
            if (!courseExists) {
              console.log(`   ⚠️  Course ${product.course_connected_id} not found, setting to null`);
              productData.course_connected_id = null;
            } else {
              console.log(`   ✅ Course ${product.course_connected_id} exists`);
            }
          }

          if (product.quiz_id) {
            console.log(`   Checking quiz_id: ${product.quiz_id}`);
            const { data: quizExists } = await supabase
              .from('quiz')
              .select('id')
              .eq('id', product.quiz_id)
              .eq('organization_id', sourceOrgId)
              .single();
            
            if (!quizExists) {
              console.log(`   ⚠️  Quiz ${product.quiz_id} not found, setting to null`);
              productData.quiz_id = null;
            } else {
              console.log(`   ✅ Quiz ${product.quiz_id} exists`);
            }
          }

          // Log what we would insert
          console.log('   📝 Would insert product with:');
          console.log(`      - organization_id: ${productData.organization_id}`);
          console.log(`      - product_sub_type_id: ${productData.product_sub_type_id}`);
          console.log(`      - course_connected_id: ${productData.course_connected_id}`);
          console.log(`      - quiz_id: ${productData.quiz_id}`);
          console.log(`      - stripe_product_id: ${productData.stripe_product_id}`);

          // For testing, we WON'T actually insert to avoid creating test data
          // const { error: cloneProductError } = await supabase
          //   .from('product')
          //   .insert([productData]);

          console.log('   ✅ Product processing successful (simulated)');
          successfulProducts++;

        } catch (productError) {
          console.log(`   ❌ Error processing product: ${productError.message}`);
          failedProducts++;
        }
      }

      console.log(`\n📊 Results: ${successfulProducts}/${sourceProducts.length} successful (simulated)`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testProductCloningLogic();
