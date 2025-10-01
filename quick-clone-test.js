// Quick clone test to verify products are now working
const API_BASE = 'http://localhost:3000';

async function quickCloneTest() {
  console.log('🚀 Testing Clone After Server Restart\n');

  try {
    // Get auth token (we'll use the existing session)
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'info@codedharmony.com',
        password: 'Website2022!!'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('✅ Authenticated successfully');

    // Perform a clone
    const cloneResponse = await fetch(`${API_BASE}/api/organizations/b8cf89ba-de99-4a5c-acfb-15050cfb069a/clone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        customName: 'test-restart-clone'
      })
    });

    if (!cloneResponse.ok) {
      const error = await cloneResponse.text();
      console.log('❌ Clone failed:', cloneResponse.status, error);
      return;
    }

    const cloneResult = await cloneResponse.json();
    console.log('✅ Clone initiated successfully');
    console.log('📊 Clone Results:');
    console.log('   Products:', cloneResult.cloneResults?.products ? '✅' : '❌');
    console.log('   Product Sub-types:', cloneResult.cloneResults?.productSubTypes ? '✅' : '❌');
    console.log('   Pricing Plans:', cloneResult.cloneResults?.pricingPlans ? '✅' : '❌');
    
    // Give it a moment to complete
    console.log('\n⏳ Waiting for clone to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check the cloned organization for actual counts
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: clonedOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', cloneResult.organization.id)
      .single();

    if (clonedOrg) {
      // Check actual counts
      const { data: products } = await supabase
        .from('product')
        .select('*')
        .eq('organization_id', clonedOrg.id);

      const { data: subTypes } = await supabase
        .from('product_sub_type')
        .select('*')
        .eq('organization_id', clonedOrg.id);

      const { data: pricingPlans } = await supabase
        .from('pricing_plan')
        .select('*')
        .eq('organization_id', clonedOrg.id);

      console.log('\n📈 Actual Counts in Cloned Organization:');
      console.log(`   Products: ${products?.length || 0}`);
      console.log(`   Product Sub-types: ${subTypes?.length || 0}`);
      console.log(`   Pricing Plans: ${pricingPlans?.length || 0}`);

      if (products && products.length > 0) {
        console.log('\n🎉 SUCCESS: Products are now being cloned!');
        products.forEach((product, i) => {
          console.log(`   ${i+1}. "${product.product_name}"`);
        });
      } else {
        console.log('\n❌ Products still not being cloned');
      }
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

quickCloneTest();
