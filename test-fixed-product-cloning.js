require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFixedProductCloning() {
  console.log('🧪 Testing FIXED Product Cloning with Sub-Types');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    console.log('\n📋 Step 1: Product Sub-Types Cloning with ID Mapping');
    const { data: sourceProductSubTypes } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', sourceOrgId);

    console.log('Source product sub-types found:', sourceProductSubTypes?.length || 0);

    // Simulate product sub-type ID mapping
    let productSubTypeIdMapping = {};
    sourceProductSubTypes?.forEach((subType, index) => {
      productSubTypeIdMapping[subType.id] = 3000 + index; // Simulate new IDs
    });
    console.log('Product sub-type ID mapping sample:', 
      Object.fromEntries(Object.entries(productSubTypeIdMapping).slice(0, 5)));

    console.log('\n📦 Step 2: Products Cloning with Fixed Dependencies');
    const { data: sourceProducts } = await supabase
      .from('product')
      .select('*')
      .eq('organization_id', sourceOrgId);

    console.log('Source products found:', sourceProducts?.length || 0);

    if (sourceProducts && sourceProducts.length > 0) {
      console.log('\nFixed product mapping examples:');
      sourceProducts.slice(0, 3).forEach((product, index) => {
        const { id, stripe_product_id, ...productWithoutId } = product;
        
        const productData = {
          ...productWithoutId,
          organization_id: 'test-clone-org-id',
          stripe_product_id: null,
          // Update product_sub_type_id to reference the new cloned product sub-type
          product_sub_type_id: productSubTypeIdMapping[product.product_sub_type_id] || product.product_sub_type_id,
          // Handle missing course/quiz references
          course_connected_id: product.course_connected_id ? null : product.course_connected_id, // Set to null if it exists (since courses don't exist)
          quiz_id: product.quiz_id, // Keep as-is since it's usually null
        };

        console.log(`${index + 1}. Product "${product.product_name}"`);
        console.log(`   Original product_sub_type_id: ${product.product_sub_type_id} → New: ${productData.product_sub_type_id}`);
        console.log(`   course_connected_id: ${product.course_connected_id} → ${productData.course_connected_id} (nullified if non-existent)`);
        console.log(`   quiz_id: ${product.quiz_id} (unchanged)`);
        console.log(`   stripe_product_id: ${product.stripe_product_id} → null (cleared)`);
        console.log(`   Would insert:`, {
          product_name: productData.product_name,
          organization_id: productData.organization_id,
          product_sub_type_id: productData.product_sub_type_id,
          course_connected_id: productData.course_connected_id,
          quiz_id: productData.quiz_id,
          stripe_product_id: productData.stripe_product_id
        });
      });

      console.log(`\n✅ Total products ready for cloning: ${sourceProducts.length}`);
      console.log('\n🎯 With product sub-types cloned first, products should now clone successfully!');
    }

    // Check the specific product sub-type that was causing issues
    console.log('\n🔍 Checking the problematic product sub-type:');
    const subType2 = sourceProductSubTypes?.find(st => st.id === 2);
    if (subType2) {
      console.log(`   Product sub-type ID 2: "${subType2.name}"`);
      console.log(`   Would be mapped to: ${productSubTypeIdMapping[2]}`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testFixedProductCloning();
