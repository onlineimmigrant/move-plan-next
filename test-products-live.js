const fetch = require('node-fetch');

async function testProductsPageJSONLD() {
  try {
    console.log('Fetching products page from http://localhost:3000/en/products...');
    
    const response = await fetch('http://localhost:3000/en/products');
    const html = await response.text();
    
    // Extract JSON-LD script tag
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
    
    if (jsonLdMatch) {
      const jsonLdData = JSON.parse(jsonLdMatch[1]);
      console.log('\n=== JSON-LD Data Found ===');
      
      // Check if it's an array or single object
      const structuredDataArray = Array.isArray(jsonLdData) ? jsonLdData : [jsonLdData];
      
      // Find Product schemas
      const productSchemas = structuredDataArray.filter(item => item['@type'] === 'Product');
      
      console.log(`\nFound ${productSchemas.length} Product schemas in JSON-LD`);
      
      if (productSchemas.length > 0) {
        // Check first few products
        productSchemas.slice(0, 5).forEach((product, index) => {
          console.log(`\n--- Product ${index + 1} ---`);
          console.log(`Name: ${product.name}`);
          console.log(`Has aggregateRating: ${!!product.aggregateRating}`);
          if (product.aggregateRating) {
            console.log(`  Rating Value: ${product.aggregateRating.ratingValue}`);
            console.log(`  Review Count: ${product.aggregateRating.reviewCount}`);
          }
          console.log(`Has reviews: ${!!product.review && product.review.length > 0}`);
          if (product.review) {
            console.log(`  Number of reviews: ${product.review.length}`);
            console.log(`  First review rating: ${product.review[0]?.reviewRating?.ratingValue}`);
          }
        });
        
        // Count products with and without ratings
        const withRatings = productSchemas.filter(p => p.aggregateRating);
        const withoutRatings = productSchemas.filter(p => !p.aggregateRating);
        
        console.log(`\n=== Summary ===`);
        console.log(`Products with aggregateRating: ${withRatings.length}`);
        console.log(`Products without aggregateRating: ${withoutRatings.length}`);
        
        if (withoutRatings.length > 0) {
          console.log('\nProducts WITHOUT aggregateRating:');
          withoutRatings.slice(0, 3).forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.name}`);
          });
        }
      } else {
        console.log('No Product schemas found in JSON-LD');
        console.log('Available schemas:');
        structuredDataArray.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item['@type']}`);
        });
      }
    } else {
      console.log('No JSON-LD script tag found in HTML');
      console.log('HTML length:', html.length);
      
      // Check if there are any script tags at all
      const scriptMatches = html.match(/<script[^>]*>/g);
      console.log('Found script tags:', scriptMatches ? scriptMatches.length : 0);
    }
  } catch (error) {
    console.error('Error fetching products page:', error.message);
  }
}

testProductsPageJSONLD();
