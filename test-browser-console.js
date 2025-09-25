// Browser console test script to check Article JSON-LD
// Copy and paste this into browser console on: http://localhost:3000/managing-subscriptions-and-payments

console.log('🔍 Testing Article JSON-LD in browser...');

// Wait for the page to fully load
setTimeout(() => {
  console.log('📊 Checking for JSON-LD scripts...');
  
  // Find all JSON-LD scripts
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  console.log(`Found ${jsonLdScripts.length} JSON-LD scripts`);
  
  jsonLdScripts.forEach((script, index) => {
    console.log(`\n🔸 Script ${index + 1}:`);
    console.log('   Attributes:', Array.from(script.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', '));
    
    try {
      const data = JSON.parse(script.textContent);
      console.log('   Type:', data['@type']);
      
      if (data['@type'] === 'Article') {
        console.log('   ✅ FOUND ARTICLE JSON-LD!');
        console.log('   Title:', data.headline);
        console.log('   Author:', data.author?.name);
        console.log('   Publisher:', data.publisher?.name);
        console.log('   Word Count:', data.wordCount);
        console.log('   Keywords:', data.keywords);
        console.log('   Full data:', data);
      }
    } catch (e) {
      console.log('   ❌ Invalid JSON');
    }
  });
  
  // Check specifically for our Article script
  const articleScript = document.querySelector('script[type="application/ld+json"][data-article="true"]');
  if (articleScript) {
    console.log('\n🎯 ARTICLE-SPECIFIC SCRIPT FOUND!');
    try {
      const articleData = JSON.parse(articleScript.textContent);
      console.log('Article JSON-LD:', articleData);
    } catch (e) {
      console.log('❌ Could not parse Article JSON-LD');
    }
  } else {
    console.log('\n❌ No Article-specific script found with data-article="true"');
  }
  
  // Check if the useEffect ran
  console.log('\n📝 Look for debug messages above that start with "🎯 Article JSON-LD"');
  
}, 3000);

console.log('⏳ Waiting 3 seconds for page to fully load and useEffect to run...');
