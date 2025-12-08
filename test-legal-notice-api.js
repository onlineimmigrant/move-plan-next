// Test script to verify legal_notice API
// Run this in browser console

async function testLegalNoticeAPI() {
  console.log('🧪 Testing Legal Notice API...');
  
  // Get current settings
  const settings = JSON.parse(localStorage.getItem('settings') || '{}');
  const orgId = settings.organization_id || 'YOUR_ORG_ID_HERE';
  
  console.log('Organization ID:', orgId);
  
  // Test data
  const testData = {
    organization_id: orgId,
    legal_notice: {
      enabled: true,
      company_name: 'Test Company Ltd',
      legal_form: 'Limited Company',
      registered_address: '123 Test Street, London, UK',
      registration_number: 'TEST123456',
      vat_number: 'GB123456789',
      managing_directors: ['John Doe', 'Jane Smith'],
      contact_email: 'legal@test.com',
      contact_phone: '+44 20 1234 5678',
      trade_registry: 'Companies House',
      professional_licenses: ['FCA: 123456'],
      regulatory_bodies: ['Financial Conduct Authority'],
      show_footer_disclaimer: true,
      footer_disclaimer: 'Authorized and regulated by the FCA. FRN: 123456'
    }
  };
  
  console.log('📤 Sending test data:', testData);
  
  try {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('📥 Response data:', data);
    
    if (response.ok) {
      console.log('✅ SUCCESS! Legal notice saved.');
      console.log('Saved legal_notice:', data.settings?.legal_notice);
    } else {
      console.error('❌ FAILED:', data.error);
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

// Run the test
testLegalNoticeAPI();
