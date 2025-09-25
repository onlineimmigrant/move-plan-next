const fetch = require('node-fetch');

async function debugAPI() {
  try {
    console.log('🔍 Testing post API...');
    
    const baseUrl = 'http://localhost:3000';
    const organizationId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
    const slug = 'managing-subscriptions-and-payments';
    
    console.log(`📡 Calling: ${baseUrl}/api/posts/${slug}?organization_id=${organizationId}`);
    
    const response = await fetch(`${baseUrl}/api/posts/${slug}?organization_id=${organizationId}`);
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Success! Post data:');
    console.log('  📝 Title:', data.title);
    console.log('  🆔 ID:', data.id);
    console.log('  🔗 Slug:', data.slug);
    console.log('  👁️ Display:', data.display_this_post);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

debugAPI();
