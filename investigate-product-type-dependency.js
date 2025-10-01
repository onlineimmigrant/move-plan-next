require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateProductTypeDependency() {
  console.log('🔍 Investigating Product Type Dependency');
  
  const sourceOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  try {
    // Check product_sub_type structure
    console.log('1. Analyzing product_sub_type table structure...');
    const { data: productSubTypes } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', sourceOrgId)
      .limit(5);

    if (productSubTypes && productSubTypes.length > 0) {
      console.log('Product sub-type sample structure:');
      console.log('Fields:', Object.keys(productSubTypes[0]));
      console.log('Sample record:', productSubTypes[0]);
    }

    // Check if product_type_name exists as a separate table
    console.log('\n2. Checking if product_type_name is a separate table...');
    const { data: productTypes, error: productTypesError } = await supabase
      .from('product_type_name')
      .select('*')
      .limit(5);

    console.log('Product types found:', productTypes?.length || 0);
    console.log('Error:', productTypesError?.message);

    if (productTypes && productTypes.length > 0) {
      console.log('Product types structure:');
      console.log('Fields:', Object.keys(productTypes[0]));
      productTypes.forEach((type, index) => {
        console.log(`${index + 1}.`, type);
      });
    }

    // Check pricing plans structure
    console.log('\n3. Analyzing pricing plans structure...');
    const { data: pricingPlans } = await supabase
      .from('pricingplan')
      .select('*')
      .eq('organization_id', sourceOrgId)
      .limit(3);

    console.log('Pricing plans found:', pricingPlans?.length || 0);
    if (pricingPlans && pricingPlans.length > 0) {
      console.log('Pricing plan fields:', Object.keys(pricingPlans[0]));
      console.log('Sample pricing plan:', pricingPlans[0]);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

investigateProductTypeDependency();
