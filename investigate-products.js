require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rgbmdfaoowqbgshjuwwm.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function investigateProductCloning() {
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    console.log('🔍 Investigating Product Cloning Issues');
    console.log('Source Organization ID:', sourceOrgId);
    
    // 1. Check if products exist in source organization
    console.log('\n1. Checking source products:');
    const { data: sourceProducts, error: productsError } = await supabase
      .from('product')
      .select('*')
      .eq('organization_id', sourceOrgId);
    
    console.log(`   Products found: ${sourceProducts?.length || 0}`);
    if (productsError) {
      console.log('   ❌ Error:', productsError);
      return;
    }
    
    if (sourceProducts && sourceProducts.length > 0) {
      console.log('   ✅ Source products found!');
      console.log('   Sample product keys:', Object.keys(sourceProducts[0]));
      
      // Check for potential problematic fields
      const sampleProduct = sourceProducts[0];
      console.log('\n2. Checking for potential issues:');
      
      // Check for null/undefined required fields
      const requiredFields = ['product_name', 'organization_id'];
      requiredFields.forEach(field => {
        console.log(`   ${field}: ${sampleProduct[field] !== null && sampleProduct[field] !== undefined ? '✅' : '❌'} (${sampleProduct[field]})`);
      });
      
      // Check for foreign key constraints
      console.log('\n3. Checking foreign key constraints:');
      
      if (sampleProduct.product_sub_type_id) {
        const { data: subType, error: subTypeError } = await supabase
          .from('product_sub_type')
          .select('*')
          .eq('id', sampleProduct.product_sub_type_id)
          .single();
        console.log(`   product_sub_type_id (${sampleProduct.product_sub_type_id}): ${!subTypeError ? '✅' : '❌'}`);
        if (subTypeError) console.log('     Error:', subTypeError.message);
      }
      
      if (sampleProduct.course_connected_id) {
        console.log(`   course_connected_id: ${sampleProduct.course_connected_id} (potential FK constraint)`);
      }
      
      if (sampleProduct.quiz_id) {
        console.log(`   quiz_id: ${sampleProduct.quiz_id} (potential FK constraint)`);
      }
      
      // Test insertion with a mock cloned organization
      console.log('\n4. Testing product insertion simulation:');
      const mockClonedOrgId = 'mock-test-org-id';
      
      const testProduct = {
        ...sampleProduct,
        organization_id: mockClonedOrgId,
      };
      delete testProduct.id;
      
      console.log('   Product to insert (without ID):', {
        product_name: testProduct.product_name,
        organization_id: testProduct.organization_id,
        product_sub_type_id: testProduct.product_sub_type_id,
        course_connected_id: testProduct.course_connected_id,
        quiz_id: testProduct.quiz_id,
        '...': 'and other fields'
      });
      
      // Note: We won't actually insert this to avoid creating test data
      console.log('   ℹ️  Simulated insertion would use the above data structure');
      
    } else {
      console.log('   ❌ No products found in source organization');
    }
    
    console.log('\n5. Checking product table constraints:');
    // Check if there are any unique constraints or other issues
    const { data: constraints, error: constraintError } = await supabase.rpc('get_table_constraints', { table_name: 'product' });
    
    if (constraintError && constraintError.code === 'PGRST202') {
      console.log('   ℹ️  Cannot query constraints directly (function not available)');
    } else if (constraintError) {
      console.log('   ❌ Error querying constraints:', constraintError);
    } else {
      console.log('   Table constraints:', constraints);
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  }
}

investigateProductCloning();
