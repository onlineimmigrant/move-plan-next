// Test enhanced Product JSON-LD with applicableCountry
const enhancedProductExample = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Test Product',
  description: 'A great product for testing',
  sku: '123',
  offers: {
    '@type': 'Offer',
    price: '99.99',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
      applicableCountry: ['US', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'SE', 'DK', 'NO', 'FI']
    }
  }
};

console.log('Enhanced Product JSON-LD with applicableCountry:');
console.log(JSON.stringify(enhancedProductExample, null, 2));
