const http = require('http');

// Test Article JSON-LD on a post page
const testArticleJsonLd = (path = '/en/test') => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: path,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`Testing Article JSON-LD for: ${path}`);
      console.log('Response status:', res.statusCode);
      
      if (res.statusCode === 200) {
        // Check for Article JSON-LD
        const articleJsonLdMatches = data.match(/<script[^>]*type="application\/ld\+json"[^>]*data-article="true"[^>]*>(.*?)<\/script>/gs);
        
        if (articleJsonLdMatches) {
          console.log('✅ Found Article JSON-LD structured data');
          articleJsonLdMatches.forEach((match, index) => {
            const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
            try {
              const parsed = JSON.parse(jsonContent);
              console.log(`\n=== Article JSON-LD ${index + 1} ===`);
              console.log('- Type:', parsed['@type']);
              console.log('- Headline:', parsed.headline);
              console.log('- URL:', parsed.url);
              console.log('- Date Published:', parsed.datePublished);
              console.log('- Author Type:', parsed.author?.['@type']);
              console.log('- Author Name:', parsed.author?.name);
              console.log('- Publisher:', parsed.publisher?.name);
              console.log('- Has Image:', !!parsed.image);
              console.log('- Has Reviews:', !!parsed.review);
              console.log('- Has FAQs:', !!parsed.mainEntity);
              console.log('- Word Count:', parsed.wordCount);
            } catch (e) {
              console.log(`❌ Failed to parse Article JSON-LD ${index + 1}:`, e.message);
            }
          });
        } else {
          console.log('❌ No Article JSON-LD structured data found');
          
          // Check if there's any JSON-LD at all
          const anyJsonLd = data.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs);
          if (anyJsonLd) {
            console.log(`Found ${anyJsonLd.length} other JSON-LD scripts (but no Article type)`);
          } else {
            console.log('No JSON-LD scripts found at all');
          }
        }
      } else {
        console.log('❌ Page not found or error:', res.statusCode);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Problem with request: ${e.message}`);
  });

  req.end();
};

// Test different paths
console.log('Testing Article JSON-LD implementation...\n');
testArticleJsonLd('/en/test');

setTimeout(() => {
  testArticleJsonLd('/en/about');
}, 2000);

setTimeout(() => {
  testArticleJsonLd('/en/contact');
}, 4000);
