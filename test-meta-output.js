const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Start the dev server in background
  console.log('Starting dev server...');
  const serverProcess = execSync('npm run dev &', { cwd: '/Users/ois/move-plan-next' });
  
  // Wait a bit for server to start
  setTimeout(() => {
    try {
      // Fetch the home page
      const response = execSync('curl -s http://localhost:3000/en', { encoding: 'utf8' });
      
      // Extract meta tags
      const metaTagRegex = /<meta[^>]*>/gi;
      const titleRegex = /<title[^>]*>.*?<\/title>/gi;
      const metaTags = response.match(metaTagRegex) || [];
      const titleTags = response.match(titleRegex) || [];
      
      console.log('=== TITLE TAGS ===');
      titleTags.forEach((tag, index) => {
        console.log(`${index + 1}. ${tag}`);
      });
      
      console.log('\n=== META TAGS ===');
      metaTags.forEach((tag, index) => {
        console.log(`${index + 1}. ${tag}`);
      });
      
      console.log(`\n=== SUMMARY ===`);
      console.log(`Total title tags: ${titleTags.length}`);
      console.log(`Total meta tags: ${metaTags.length}`);
      
      // Look for duplicates
      const tagContents = metaTags.map(tag => tag.toLowerCase());
      const duplicates = tagContents.filter((tag, index) => tagContents.indexOf(tag) !== index);
      
      if (duplicates.length > 0) {
        console.log('\n=== DUPLICATES FOUND ===');
        duplicates.forEach(dup => console.log(dup));
      }
      
    } catch (fetchError) {
      console.error('Error fetching page:', fetchError.message);
    }
  }, 3000);
  
} catch (error) {
  console.error('Error:', error.message);
}
