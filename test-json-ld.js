const https = require('http');

// Test the enhanced JSON-LD structured data
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/en',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    // Extract JSON-LD structured data
    const jsonLdMatches = data.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs);
    
    if (jsonLdMatches) {
      console.log('Found JSON-LD structured data:');
      jsonLdMatches.forEach((match, index) => {
        const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        try {
          const parsed = JSON.parse(jsonContent);
          console.log(`\n=== JSON-LD ${index + 1} ===`);
          console.log(JSON.stringify(parsed, null, 2));
          
          // Check for our specific enhancements
          if (parsed['@type'] === 'Product' || parsed['@type'] === 'ItemList') {
            console.log('\n=== Enhanced Fields Check ===');
            
            if (parsed.itemListElement) {
              // ItemList - check for Carousels enhancements
              console.log('- ItemList type detected (for Carousels)');
              console.log('- Has image field:', !!parsed.image);
              console.log('- Has aggregateRating:', !!parsed.aggregateRating);
              console.log('- Items count:', parsed.itemListElement.length);
              
              if (parsed.itemListElement[0]) {
                const firstItem = parsed.itemListElement[0].item;
                console.log('- First item price:', firstItem.offers?.price);
                console.log('- Price multiplied by 100:', firstItem.offers?.price >= 100);
                console.log('- Has image field:', !!firstItem.image);
                console.log('- Has shippingDetails:', !!firstItem.offers?.shippingDetails);
                console.log('- Has hasMerchantReturnPolicy:', !!firstItem.offers?.hasMerchantReturnPolicy);
                console.log('- Has review array:', Array.isArray(firstItem.review));
                console.log('- Has aggregateRating:', !!firstItem.aggregateRating);
                console.log('- Has priceValidUntil:', !!firstItem.offers?.priceValidUntil);
              }
            }
          }
        } catch (e) {
          console.log(`Failed to parse JSON-LD ${index + 1}:`, e.message);
        }
      });
    } else {
      console.log('No JSON-LD structured data found');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
