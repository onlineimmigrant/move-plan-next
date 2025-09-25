// Create a mock post to test Article JSON-LD
const mockPost = {
  id: 'test-123',
  slug: 'test-article',
  title: 'Test Article Title',
  description: 'This is a test article description for testing Article JSON-LD structured data.',
  content: '<p>This is the test article content with <strong>HTML tags</strong> that should be cleaned up for the articleBody field.</p>',
  created_on: '2024-09-20T10:00:00Z',
  last_modified: '2024-09-22T15:30:00Z',
  is_with_author: true,
  is_company_author: false,
  author: { first_name: 'John', last_name: 'Doe' },
  excerpt: 'This is a test excerpt',
  featured_image: 'https://example.com/test-image.jpg',
  keywords: 'test, article, json-ld, structured data',
  section: 'Testing',
  display_this_post: true,
  reviews: [
    { rating: 5, author: 'Alice Smith', comment: 'Great article!' },
    { rating: 4, author: 'Bob Johnson', comment: 'Very helpful content.' }
  ],
  faqs: [
    { question: 'What is this article about?', answer: 'This article tests JSON-LD implementation.' },
    { question: 'How do I test structured data?', answer: 'Use Google\'s Rich Results Test tool.' }
  ]
};

// Test the Article JSON-LD generation
const testArticleJsonLd = async () => {
  console.log('Testing Article JSON-LD generation...\n');
  
  // Mock settings
  const mockSettings = {
    site: 'Test Site',
    seo_og_image: 'https://example.com/og-image.jpg'
  };
  
  const baseUrl = 'http://localhost:3001';
  const slug = 'test-article';
  const canonicalBaseUrl = baseUrl.replace(/\/$/, '');
  const articleUrl = `${canonicalBaseUrl}/${slug}`;
  
  // Create Article structured data (same logic as in the component)
  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${articleUrl}#article`,
    headline: mockPost.title,
    url: articleUrl,
    datePublished: mockPost.created_on,
    dateModified: mockPost.last_modified || mockPost.created_on,
    description: mockPost.description || mockPost.excerpt || '',
    articleBody: mockPost.content?.replace(/<[^>]*>/g, '').substring(0, 500) + '...',
    
    // Author information
    author: mockPost.is_company_author || !mockPost.author ? {
      '@type': 'Organization',
      name: mockSettings?.site || 'Organization',
      url: canonicalBaseUrl
    } : {
      '@type': 'Person',
      name: `${mockPost.author.first_name} ${mockPost.author.last_name}`.trim()
    },

    // Publisher information
    publisher: {
      '@type': 'Organization',
      name: mockSettings?.site || 'Organization',
      url: canonicalBaseUrl,
      logo: mockSettings?.seo_og_image ? {
        '@type': 'ImageObject',
        url: mockSettings.seo_og_image
      } : undefined
    },

    // Main entity of page
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl
    },

    // Article image
    image: mockPost.featured_image ? {
      '@type': 'ImageObject',
      url: mockPost.featured_image.startsWith('http') ? mockPost.featured_image : `${canonicalBaseUrl}${mockPost.featured_image}`,
      width: 1200,
      height: 630
    } : mockSettings?.seo_og_image ? {
      '@type': 'ImageObject',
      url: mockSettings.seo_og_image,
      width: 1200,
      height: 630
    } : undefined,

    // Keywords
    keywords: mockPost.keywords ? mockPost.keywords.split(',').map(k => k.trim()) : undefined,

    // Article section
    articleSection: mockPost.section || undefined,

    // Word count (approximate)
    wordCount: mockPost.content ? mockPost.content.replace(/<[^>]*>/g, '').split(/\s+/).length : undefined,

    // Language
    inLanguage: 'en-US',

    // Reviews if available
    review: mockPost.reviews?.map(review => ({
      '@type': 'Review',
      reviewBody: review.comment,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating.toString(),
        bestRating: '5',
        worstRating: '1'
      },
      author: {
        '@type': 'Person',
        name: review.author
      }
    })) || undefined,

    // FAQs if available
    mainEntity: mockPost.faqs?.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    })) || undefined
  };

  // Remove undefined properties
  Object.keys(articleStructuredData).forEach(key => {
    if (articleStructuredData[key] === undefined) {
      delete articleStructuredData[key];
    }
  });

  console.log('✅ Generated Article JSON-LD:');
  console.log(JSON.stringify(articleStructuredData, null, 2));
  
  console.log('\n🔍 Validation Check:');
  console.log('- Type:', articleStructuredData['@type']);
  console.log('- Headline:', articleStructuredData.headline);
  console.log('- URL:', articleStructuredData.url);
  console.log('- Author Type:', articleStructuredData.author['@type']);
  console.log('- Author Name:', articleStructuredData.author.name);
  console.log('- Publisher:', articleStructuredData.publisher.name);
  console.log('- Has Image:', !!articleStructuredData.image);
  console.log('- Has Reviews:', !!articleStructuredData.review);
  console.log('- Reviews Count:', articleStructuredData.review?.length || 0);
  console.log('- Has FAQs:', !!articleStructuredData.mainEntity);
  console.log('- FAQs Count:', articleStructuredData.mainEntity?.length || 0);
  console.log('- Word Count:', articleStructuredData.wordCount);
  console.log('- Keywords:', articleStructuredData.keywords?.join(', ') || 'none');
  
  return articleStructuredData;
};

testArticleJsonLd();
