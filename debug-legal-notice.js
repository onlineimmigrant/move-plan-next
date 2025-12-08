// Debug script to check Legal Notice data
// Run this in the browser console on your app page

async function debugLegalNotice() {
  console.log('🔍 Starting Legal Notice Debug...\n');
  
  // 1. Check what's in the SettingsContext
  const settingsContext = window.__NEXT_DATA__?.props?.pageProps?.initialSettings;
  console.log('1️⃣ Initial Settings from SSR:', settingsContext);
  console.log('   - Has legal_notice:', !!settingsContext?.legal_notice);
  console.log('   - legal_notice.enabled:', settingsContext?.legal_notice?.enabled);
  console.log('   - Full legal_notice:', settingsContext?.legal_notice);
  
  // 2. Check API response
  try {
    const response = await fetch('/api/settings', {
      method: 'GET',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n2️⃣ API Response (/api/settings GET):', data);
      console.log('   - Has legal_notice:', !!data?.legal_notice);
      console.log('   - legal_notice.enabled:', data?.legal_notice?.enabled);
      console.log('   - Full legal_notice:', data?.legal_notice);
    } else {
      console.error('   ❌ API call failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('   ❌ Error calling API:', error);
  }
  
  // 3. Test saving data
  console.log('\n3️⃣ Test Save (will set enabled=true):');
  const testData = {
    legal_notice: {
      enabled: true,
      company_name: 'Test Company',
      legal_form: 'GmbH',
      registered_address: '123 Test St',
      registration_number: 'HRB12345',
      vat_number: 'DE123456789',
      managing_directors: ['Test Director'],
      contact_email: 'test@example.com',
      contact_phone: '+49 123 456789',
      trade_registry: 'Berlin',
      professional_licenses: [],
      regulatory_bodies: [],
      show_footer_disclaimer: false,
      footer_disclaimer: ''
    }
  };
  
  console.log('   Sending test data:', testData);
  
  try {
    // Get current settings to extract organization_id
    const currentSettings = await fetch('/api/settings').then(r => r.json());
    const organization_id = currentSettings.organization_id;
    
    const saveResponse = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organization_id,
        ...testData
      })
    });
    
    if (saveResponse.ok) {
      const saveData = await saveResponse.json();
      console.log('   ✅ Save successful:', saveData);
      console.log('   - Returned legal_notice.enabled:', saveData?.settings?.legal_notice?.enabled);
    } else {
      const errorData = await saveResponse.json();
      console.error('   ❌ Save failed:', errorData);
    }
  } catch (error) {
    console.error('   ❌ Error saving:', error);
  }
  
  console.log('\n✅ Debug complete. Now reload the page and check if Legal Notice button appears in footer.');
}

// Auto-run
debugLegalNotice();
