const http = require('http');

// Test different post slugs to find existing posts
const testSlugs = ['about', 'contact', 'privacy', 'terms', 'home', 'blog', 'post', 'article', 'sqe', 'exam', 'guide'];

const testPostExists = (slug) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/posts/${slug}?organization_id=de0d5c21-787f-49c2-a665-7ff8e599c891`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const post = JSON.parse(data);
            console.log(`✅ Found post: ${slug} - "${post.title}"`);
            resolve({ slug, exists: true, post });
          } catch (e) {
            resolve({ slug, exists: false, error: 'Parse error' });
          }
        } else {
          resolve({ slug, exists: false, status: res.statusCode });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ slug, exists: false, error: e.message });
    });

    req.setTimeout(5000, () => {
      resolve({ slug, exists: false, error: 'timeout' });
    });

    req.end();
  });
};

// Test all slugs
const testAllSlugs = async () => {
  console.log('Testing for existing posts...\n');
  
  for (const slug of testSlugs) {
    const result = await testPostExists(slug);
    if (!result.exists) {
      console.log(`❌ ${slug}: ${result.error || result.status || 'not found'}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\nDone testing post slugs.');
};

testAllSlugs();
