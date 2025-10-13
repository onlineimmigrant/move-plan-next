const fetch = require('node-fetch');
require('dotenv').config({ path: '.env' });

async function testOrganizationAPI() {
  // Test with the organization ID that has blog posts
  const orgId = '6695b959-45ef-44b4-a68c-9cd0fe0e25a3';
  const url = `http://localhost:3001/api/organizations/${orgId}`;
  
  console.log(`🔍 Testing API: ${url}\n`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error response:', error);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n📊 Response Structure:');
    console.log('  organization:', !!data.organization);
    console.log('  settings:', !!data.settings);
    console.log('  website_hero:', !!data.website_hero);
    console.log('  menu_items:', data.menu_items?.length || 0);
    console.log('  blog_posts:', data.blog_posts?.length || 0, '⭐');
    console.log('  products:', data.products?.length || 0);
    console.log('  features:', data.features?.length || 0);
    console.log('  faqs:', data.faqs?.length || 0);
    console.log('  banners:', data.banners?.length || 0);
    
    if (data.blog_posts && data.blog_posts.length > 0) {
      console.log('\n✅ Blog Posts Found!');
      console.log('\n📝 Sample Blog Post:');
      const post = data.blog_posts[0];
      console.log('  ID:', post.id);
      console.log('  Title:', post.title);
      console.log('  Slug:', post.slug);
      console.log('  display_this_post:', post.display_this_post);
      console.log('  display_as_blog_post:', post.display_as_blog_post);
      console.log('  order:', post.order);
      console.log('  Has display_config:', !!post.display_config);
      console.log('  Has organization_config:', !!post.organization_config);
      console.log('  Has media_config:', !!post.media_config);
      
      if (post.display_config) {
        console.log('\n  display_config:', JSON.stringify(post.display_config, null, 4));
      }
    } else {
      console.log('\n⚠️  No blog_posts in response!');
      console.log('Full response keys:', Object.keys(data));
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

testOrganizationAPI().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
