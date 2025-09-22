// Test script to check products page JSON-LD data
const { fetchPageSEOData } = require('./src/lib/supabase/seo.ts');

async function testProductsSEO() {
  try {
    console.log('🧪 Testing products page SEO data...');
    
    const seoData = await fetchPageSEOData('/products', 'codedharmony.vercel.app');
    
    console.log('\n📊 SEO Data Summary:');
    console.log('- Title:', seoData.title);
    console.log('- Structured Data Items:', seoData.structuredData?.length || 0);
    
    if (seoData.structuredData && seoData.structuredData.length > 0) {
      seoData.structuredData.forEach((item, index) => {
        console.log(`\n📋 Structured Data Item ${index + 1}:`);
        console.log('- Type:', item['@type']);
        
        if (item['@type'] === 'ItemList' && item.itemListElement) {
          console.log('- Products in list:', item.itemListElement.length);
          
          // Check first few products for validation
          item.itemListElement.slice(0, 3).forEach((product, i) => {
            const productData = product.item;
            console.log(`\n  🛍️ Product ${i + 1}: ${productData.name}`);
            console.log(`    - Has offers:`, !!productData.offers);
            console.log(`    - Has aggregateRating:`, !!productData.aggregateRating);
            console.log(`    - Has review:`, !!productData.review);
            
            if (productData.offers) {
              console.log(`    - Price:`, productData.offers.price, productData.offers.priceCurrency);
            }
            
            if (productData.aggregateRating) {
              console.log(`    - Rating:`, productData.aggregateRating.ratingValue, '/', productData.aggregateRating.bestRating);
            }
          });
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing products SEO:', error);
  }
}

testProductsSEO();
