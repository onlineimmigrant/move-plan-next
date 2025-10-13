const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBlogPosts() {
  console.log('🔍 Checking blog_post table structure and data...\n');

  // Get all blog posts with their JSONB fields
  const { data: posts, error } = await supabase
    .from('blog_post')
    .select(`
      id,
      title,
      slug,
      organization_id,
      display_config,
      organization_config,
      media_config,
      created_on
    `)
    .limit(10);

  if (error) {
    console.error('❌ Error fetching blog posts:', error);
    return;
  }

  console.log(`✅ Found ${posts?.length || 0} blog posts\n`);

  if (posts && posts.length > 0) {
    posts.forEach((post, index) => {
      console.log(`\n📝 Post ${index + 1}:`);
      console.log(`  ID: ${post.id}`);
      console.log(`  Title: ${post.title}`);
      console.log(`  Slug: ${post.slug}`);
      console.log(`  Organization ID: ${post.organization_id}`);
      console.log(`  Created: ${post.created_on}`);
      console.log(`  display_config:`, JSON.stringify(post.display_config, null, 2));
      console.log(`  organization_config:`, JSON.stringify(post.organization_config, null, 2));
      console.log(`  media_config:`, JSON.stringify(post.media_config, null, 2));
    });

    // Check if JSONB fields are populated
    console.log('\n\n📊 JSONB Field Analysis:');
    const hasDisplayConfig = posts.filter(p => p.display_config && Object.keys(p.display_config).length > 0).length;
    const hasOrgConfig = posts.filter(p => p.organization_config && Object.keys(p.organization_config).length > 0).length;
    const hasMediaConfig = posts.filter(p => p.media_config && Object.keys(p.media_config).length > 0).length;

    console.log(`  display_config populated: ${hasDisplayConfig}/${posts.length}`);
    console.log(`  organization_config populated: ${hasOrgConfig}/${posts.length}`);
    console.log(`  media_config populated: ${hasMediaConfig}/${posts.length}`);

    if (hasDisplayConfig === 0 && hasOrgConfig === 0 && hasMediaConfig === 0) {
      console.log('\n⚠️  WARNING: All JSONB fields are empty! Phase 2 migration may not have run.');
    }
  } else {
    console.log('⚠️  No blog posts found in database');
  }

  // Check for old columns
  console.log('\n\n🔍 Checking for old columns...');
  const { data: oldColumnData, error: oldError } = await supabase
    .from('blog_post')
    .select('id, display_this_post, display_as_blog_post, order')
    .limit(1);

  if (!oldError && oldColumnData) {
    console.log('✅ Old columns still exist:', Object.keys(oldColumnData[0] || {}));
    if (oldColumnData[0]) {
      console.log('  display_this_post:', oldColumnData[0].display_this_post);
      console.log('  display_as_blog_post:', oldColumnData[0].display_as_blog_post);
      console.log('  order:', oldColumnData[0].order);
    }
  } else {
    console.log('❌ Old columns do not exist or error:', oldError?.message);
  }

  // Group by organization
  console.log('\n\n📊 Posts by Organization:');
  const orgGroups = {};
  posts?.forEach(post => {
    if (!orgGroups[post.organization_id]) {
      orgGroups[post.organization_id] = [];
    }
    orgGroups[post.organization_id].push(post);
  });

  Object.entries(orgGroups).forEach(([orgId, orgPosts]) => {
    console.log(`  Organization ${orgId}: ${orgPosts.length} posts`);
  });
}

checkBlogPosts().then(() => {
  console.log('\n✅ Check complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
