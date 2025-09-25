// Simple test using fetch
console.log('🔍 Testing Article JSON-LD on the page...');

// In a browser environment, you'd visit: http://localhost:3000/managing-subscriptions-and-payments
// And then run this in the console:

function checkArticleJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  console.log(`Found ${scripts.length} JSON-LD scripts`);
  
  scripts.forEach((script, index) => {
    try {
      const data = JSON.parse(script.textContent);
      console.log(`JSON-LD ${index + 1}:`, data);
      
      if (data['@type'] === 'Article') {
        console.log('✅ FOUND ARTICLE JSON-LD!');
        console.log('📝 Title:', data.headline);
        console.log('👤 Author:', data.author?.name);
        console.log('📅 Published:', data.datePublished);
        console.log('🔗 URL:', data.url);
      }
    } catch (e) {
      console.log(`Could not parse script ${index + 1}`);
    }
  });
}

// Instructions
console.log('Copy and paste the following function into browser console:');
console.log(checkArticleJsonLd.toString());
console.log('\nThen call: checkArticleJsonLd()');
