const fs = require('fs');
const https = require('http');

console.log('🔍 Fetching page source...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/managing-subscriptions-and-payments',
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Page fetched successfully');
    
    // Look for JSON-LD scripts
    const jsonLdRegex = /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs;
    const matches = data.match(jsonLdRegex);
    
    if (matches) {
      console.log(`\n✅ Found ${matches.length} JSON-LD script(s):`);
      matches.forEach((match, index) => {
        console.log(`\n📜 JSON-LD Script ${index + 1}:`);
        console.log(match);
        
        // Extract just the JSON content
        const jsonMatch = match.match(/<script[^>]*>(.*?)<\/script>/s);
        if (jsonMatch) {
          try {
            const jsonData = JSON.parse(jsonMatch[1]);
            console.log(`\n🔍 Parsed JSON-LD ${index + 1} @type:`, jsonData['@type']);
          } catch (e) {
            console.log(`\n❌ Could not parse JSON-LD ${index + 1}`);
          }
        }
      });
    } else {
      console.log('\n❌ No JSON-LD scripts found');
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error:', err.message);
});

req.end();
