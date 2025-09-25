// Simple test to verify the post data structure from the API
async function testPostAPI() {
  try {
    console.log('🔍 Testing post API for managing-subscriptions-and-payments...');
    
    const response = await fetch('http://localhost:3000/api/posts/managing-subscriptions-and-payments?organization_id=de0d5c21-787f-49c2-a665-7ff8e599c891');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const post = await response.json();
    
    console.log('✅ Post data received:');
    console.log('📝 Title:', post.title);
    console.log('👤 Author:', post.author_name);
    console.log('📅 Created:', post.created_on);
    console.log('📅 Updated:', post.last_modified);
    console.log('📄 Content length:', post.content?.length || 0);
    console.log('🖼️ Main photo:', post.main_photo);
    console.log('📝 Description:', post.description);
    console.log('🔗 Slug:', post.slug);
    
    // Test the word count calculation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = post.content || '';
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const wordCount = textContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    console.log('📊 Calculated word count:', wordCount);
    
    // Test content processing for keywords
    const words = textContent.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10);
    
    console.log('🔑 Sample keywords:', words);
    
    // Simulate what the Article JSON-LD would look like
    const articleData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      url: `http://localhost:3000/${post.slug}`,
      datePublished: post.created_on,
      dateModified: post.last_modified,
      wordCount: wordCount,
      keywords: words,
      author: {
        '@type': 'Person',
        name: post.author_name
      },
      publisher: {
        '@type': 'Organization',
        name: 'MetExam'
      }
    };
    
    console.log('\n🎯 Generated Article JSON-LD structure:');
    console.log(JSON.stringify(articleData, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing post API:', error);
  }
}

// Run the test
testPostAPI();
