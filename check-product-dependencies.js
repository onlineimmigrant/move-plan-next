require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProductDependencies() {
  console.log('🔍 Checking Product Dependencies');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Get a sample product to see its structure
    const { data: products, error } = await supabase
      .from('product')
      .select('*')
      .eq('organization_id', sourceOrgId)
      .limit(1);

    if (products && products.length > 0) {
      const product = products[0];
      console.log('Sample product structure:');
      Object.keys(product).forEach(key => {
        const value = product[key];
        console.log(`  ${key}: ${value} (${typeof value})`);
      });

      // Check for foreign key dependencies
      console.log('\n🔗 Checking Dependencies:');
      
      // Check if product_sub_type_id exists
      if (product.product_sub_type_id) {
        const { data: subTypes } = await supabase
          .from('product_sub_type')
          .select('id, name, organization_id')
          .eq('id', product.product_sub_type_id);
        console.log(`  product_sub_type_id ${product.product_sub_type_id}:`, subTypes?.[0] || 'NOT FOUND');
      }

      // Check if course_connected_id exists
      if (product.course_connected_id) {
        const { data: courses } = await supabase
          .from('course')
          .select('id, title, organization_id')
          .eq('id', product.course_connected_id);
        console.log(`  course_connected_id ${product.course_connected_id}:`, courses?.[0] || 'NOT FOUND');
      }

      // Check if quiz_id exists
      if (product.quiz_id) {
        const { data: quizzes } = await supabase
          .from('quiz')
          .select('id, title, organization_id')
          .eq('id', product.quiz_id);
        console.log(`  quiz_id ${product.quiz_id}:`, quizzes?.[0] || 'NOT FOUND');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProductDependencies();
