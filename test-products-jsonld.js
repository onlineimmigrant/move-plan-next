const fs = require('fs');

// Test to check if products page HTML contains only products with valid reviews
async function testProductsJSONLD() {
  try {
    // Read the actual HTML output from the products page if it exists
    const htmlPath = '.next/server/app/[locale]/products/page.html';
    
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      
      // Extract JSON-LD script tag
      const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
      
      if (jsonLdMatch) {
        const jsonLdData = JSON.parse(jsonLdMatch[1]);
        console.log('JSON-LD Data Found:');
        console.log(JSON.stringify(jsonLdData, null, 2));
        
        // Check for Product schemas
        const productSchemas = jsonLdData.filter ? jsonLdData.filter(item => item['@type'] === 'Product') : 
          (jsonLdData['@type'] === 'Product' ? [jsonLdData] : []);
        
        console.log(`\nFound ${productSchemas.length} Product schemas`);
        
        // Check if each product has aggregateRating and reviews
        productSchemas.forEach((product, index) => {
          console.log(`\nProduct ${index + 1}:`);
          console.log(`- Name: ${product.name}`);
          console.log(`- Has aggregateRating: ${!!product.aggregateRating}`);
          if (product.aggregateRating) {
            console.log(`  - Rating Value: ${product.aggregateRating.ratingValue}`);
            console.log(`  - Review Count: ${product.aggregateRating.reviewCount}`);
          }
          console.log(`- Has reviews: ${!!product.review && product.review.length > 0}`);
          if (product.review) {
            console.log(`  - Number of reviews: ${product.review.length}`);
          }
        });
      } else {
        console.log('No JSON-LD script tag found in HTML');
      }
    } else {
      console.log('Products page HTML file not found at:', htmlPath);
      console.log('This is expected for SSG pages. Let\'s check if we can access the dev server instead.');
    }
  } catch (error) {
    console.error('Error reading products page:', error);
  }
}

testProductsJSONLD();
