// Test to make actual API call and capture logs
const API_BASE = 'http://localhost:3000';
const fetch = require('node-fetch');

async function testActualAPICall() {
  console.log('🚀 Testing Actual API Call to Clone Route\n');

  try {
    // First, authenticate to get a proper user token
    console.log('🔐 Logging in...');
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
      const loginError = await loginResponse.text();
      console.log('Login error:', loginError);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Authenticated successfully');

    // Now make the clone request with the proper token
    console.log('📡 Making clone request...');

    const cloneResponse = await fetch(`${API_BASE}/api/organizations/b8cf89ba-de99-4a5c-acfb-15050cfb069a/clone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify({
        customName: 'debug-api-test'
      })
    });

    console.log('📊 Response Status:', cloneResponse.status);
    console.log('📊 Response Headers:', Object.fromEntries(cloneResponse.headers.entries()));

    if (!cloneResponse.ok) {
      const errorText = await cloneResponse.text();
      console.log('❌ API Error Response:', errorText);
      return;
    }

    const cloneResult = await cloneResponse.json();
    console.log('✅ API Response Success');
    console.log('📋 Clone Results:');
    
    if (cloneResult.cloneResults) {
      Object.entries(cloneResult.cloneResults).forEach(([key, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`   ${status} ${key}: ${value}`);
      });
    } else {
      console.log('   ⚠️  No cloneResults in response');
    }

    if (cloneResult.organization) {
      console.log('📊 Created Organization:', cloneResult.organization.id);
      
      // Quick check for products in the new organization
      const { createClient } = require('@supabase/supabase-js');
      require('dotenv').config({ path: '.env' });
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: newProducts, count: productCount } = await supabase
        .from('product')
        .select('*', { count: 'exact' })
        .eq('organization_id', cloneResult.organization.id);

      console.log(`📈 Products in new org: ${productCount || 0}`);
      
      if (newProducts && newProducts.length > 0) {
        console.log('🎉 SUCCESS: Products were created via API!');
        newProducts.slice(0, 3).forEach((product, i) => {
          console.log(`   ${i+1}. "${product.product_name}"`);
        });
      } else {
        console.log('❌ No products created via API - route execution issue');
      }
    }

  } catch (error) {
    console.error('❌ API Call Error:', error.message);
  }
}

testActualAPICall();
