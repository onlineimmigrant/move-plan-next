#!/usr/bin/env node

// Direct test of cookie services functionality
async function testCookieServicesDirectly() {
  const organizationId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
  
  console.log('🧪 Testing Cookie Services API directly...');
  
  // First, get current data
  try {
    const response = await fetch(`http://localhost:3000/api/organizations/${organizationId}`);
    const data = await response.json();
    
    console.log('📊 Current cookie services:');
    console.log(JSON.stringify(data.cookie_services, null, 2));
    
    // Add a new cookie service
    console.log('\n➕ Adding a new cookie service...');
    const currentServices = data.cookie_services || [];
    const newService = {
      id: null, // Will be assigned by database
      name: 'Test Service from Script',
      description: 'This is a test cookie service added via script',
      category_id: 1,
      active: true,
      processing_company: 'Test Company Ltd',
      organization_id: organizationId,
      order: (currentServices.length || 0) + 1
    };
    
    const updatedData = {
      cookie_services: [...currentServices, newService]
    };
    
    const updateResponse = await fetch(`http://localhost:3000/api/organizations/${organizationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token' // You may need to get a real token
      },
      body: JSON.stringify(updatedData)
    });
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Successfully added cookie service!');
      console.log('Updated count:', updateResult.organization?.cookie_services?.length);
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Failed to add cookie service:', updateResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCookieServicesDirectly();
