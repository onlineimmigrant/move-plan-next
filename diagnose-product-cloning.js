require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseProductCloning() {
  console.log('🔍 Diagnosing Product Cloning Issues');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Check recent clone to see if product sub-types are working now
    console.log('1. Checking recent clone organizations...');
    const { data: recentOrgs } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    for (const org of recentOrgs || []) {
      if (org.id === sourceOrgId) continue;
      
      console.log(`\n   ${org.name} (${org.created_at.slice(0, 10)}):`);
      
      // Check product sub-types
      const { data: subTypes } = await supabase
        .from('product_sub_type')
        .select('id, name, slug')
        .eq('organization_id', org.id);
      
      console.log(`     Product sub-types: ${subTypes?.length || 0}`);
      if (subTypes && subTypes.length > 0) {
        console.log(`     Sample: "${subTypes[0].name}" (${subTypes[0].slug})`);
      }
      
      // Check products
      const { data: products } = await supabase
        .from('product')
        .select('id, product_name, product_sub_type_id')
        .eq('organization_id', org.id);
      
      console.log(`     Products: ${products?.length || 0}`);
      if (products && products.length > 0) {
        console.log(`     Sample: "${products[0].product_name}"`);
      }
    }

    // Test the actual product cloning logic step by step
    console.log('\n2. Testing product cloning logic step by step...');
    
    // Get source data
    const { data: sourceProducts } = await supabase
      .from('product')
      .select('*')
      .eq('organization_id', sourceOrgId)
      .limit(3);

    const { data: sourceProductSubTypes } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', sourceOrgId);

    console.log('Source data:');
    console.log(`   Products: ${sourceProducts?.length || 0}`);
    console.log(`   Product sub-types: ${sourceProductSubTypes?.length || 0}`);

    if (sourceProducts && sourceProducts.length > 0 && sourceProductSubTypes && sourceProductSubTypes.length > 0) {
      // Simulate ID mapping
      let productSubTypeIdMapping = {};
      sourceProductSubTypes.forEach((subType, index) => {
        productSubTypeIdMapping[subType.id] = 4000 + index; // Simulate new IDs
      });

      console.log('\n3. Simulating product cloning with mapping:');
      sourceProducts.forEach((product, index) => {
        if (index >= 2) return; // Only show first 2
        
        const { id, stripe_product_id, ...productWithoutId } = product;
        
        const productData = {
          ...productWithoutId,
          organization_id: 'test-org-id',
          stripe_product_id: null,
          product_sub_type_id: productSubTypeIdMapping[product.product_sub_type_id] || product.product_sub_type_id,
        };

        console.log(`\n   Product ${index + 1}: "${product.product_name}"`);
        console.log(`     Original product_sub_type_id: ${product.product_sub_type_id}`);
        console.log(`     Mapped product_sub_type_id: ${productData.product_sub_type_id}`);
        console.log(`     course_connected_id: ${product.course_connected_id}`);
        console.log(`     quiz_id: ${product.quiz_id}`);
        console.log(`     Has required fields: ${!!(product.product_name && product.organization_id)}`);
      });
    }

    // Check for any constraint issues on product table
    console.log('\n4. Checking product table constraints...');
    const { data: productConstraints, error: constraintError } = await supabase
      .rpc('sql', { 
        query: `SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'product' AND constraint_type = 'UNIQUE'`
      });

    if (constraintError) {
      console.log('   Cannot query constraints directly');
    } else {
      console.log('   Product table unique constraints:', productConstraints);
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
  }
}

diagnoseProductCloning();
