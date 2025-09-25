// Direct test of the fetchProductsListingSEOData function
require('dotenv').config({ path: '.env.local' });

const { fetchProductsListingSEOData } = require('./src/lib/supabase/seo.ts');

async function testFunction() {
  try {
    console.log('Testing fetchProductsListingSEOData function directly...');
    
    const baseUrl = 'http://localhost:3000';
    const result = await fetchProductsListingSEOData(baseUrl);
    
    console.log('\n=== Function Result ===');
    console.log('Title:', result.title);
    console.log('Structured Data Items:', result.structuredData.length);
    
    // Find Product schemas
    const productSchemas = result.structuredData.filter(item => item['@type'] === 'Product');
    console.log('Product schemas found:', productSchemas.length);
    
    if (productSchemas.length > 0) {
      console.log('\n=== First 3 Products ===');
      productSchemas.slice(0, 3).forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`- Name: ${product.name}`);
        console.log(`- Has aggregateRating: ${!!product.aggregateRating}`);
        if (product.aggregateRating) {
          console.log(`  - Rating Value: ${product.aggregateRating.ratingValue}`);
          console.log(`  - Review Count: ${product.aggregateRating.reviewCount}`);
        }
        console.log(`- Has reviews: ${!!product.review && product.review.length > 0}`);
        if (product.review && product.review.length > 0) {
          console.log(`  - Number of reviews: ${product.review.length}`);
          console.log(`  - First review rating: ${product.review[0]?.reviewRating?.ratingValue}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error testing function:', error);
  }
}

testFunction();
