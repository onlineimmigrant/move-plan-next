// Test Product JSON-LD structure
const productExample = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Test Product',
  description: 'A great product for testing',
  image: 'https://example.com/image.jpg',
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
      returnFees: 'https://schema.org/FreeReturn'
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: '0',
        currency: 'USD'
      },
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: 'US'
      },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: {
          '@type': 'QuantitativeValue',
          minValue: 1,
          maxValue: 3,
          unitCode: 'DAY'
        },
        transitTime: {
          '@type': 'QuantitativeValue',
          minValue: 3,
          maxValue: 7,
          unitCode: 'DAY'
        }
      }
    }
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: 4.5,
    reviewCount: 1,
  },
  review: [
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: 4.5,
      },
      author: { '@type': 'Person', name: 'Verified Customer' },
      reviewBody: 'Great product, highly recommended!',
    }
  ]
};

console.log('Enhanced Product JSON-LD Structure:');
console.log(JSON.stringify(productExample, null, 2));
