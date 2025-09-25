const puppeteer = require('puppeteer');

async function testPageSource() {
  console.log('🔍 Testing Article JSON-LD in page source...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the post page
    console.log('📍 Navigating to: http://localhost:3000/managing-subscriptions-and-payments');
    await page.goto('http://localhost:3000/managing-subscriptions-and-payments', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Wait a bit for client-side JS to execute
    await page.waitForTimeout(3000);
    
    // Get page source
    const content = await page.content();
    
    // Look for JSON-LD scripts
    const jsonLdScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      return scripts.map(script => ({
        content: script.textContent,
        hasDataArticle: script.hasAttribute('data-article'),
        attributes: Array.from(script.attributes).map(attr => `${attr.name}="${attr.value}"`)
      }));
    });
    
    console.log('📊 Found JSON-LD scripts:', jsonLdScripts.length);
    
    jsonLdScripts.forEach((script, index) => {
      console.log(`\n🔸 Script ${index + 1}:`);
      console.log('   Attributes:', script.attributes.join(', '));
      console.log('   Has data-article:', script.hasDataArticle);
      
      try {
        const parsed = JSON.parse(script.content);
        console.log('   Type:', parsed['@type'] || 'Unknown');
        if (parsed['@type'] === 'Article') {
          console.log('   ✅ Found Article JSON-LD!');
          console.log('   Title:', parsed.headline);
          console.log('   Author:', parsed.author?.name);
          console.log('   Publisher:', parsed.publisher?.name);
          console.log('   Word Count:', parsed.wordCount);
        }
      } catch (e) {
        console.log('   ❌ Invalid JSON:', e.message);
      }
    });
    
    // Check for our specific Article script
    const articleScript = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"][data-article="true"]');
      return script ? script.textContent : null;
    });
    
    if (articleScript) {
      console.log('\n🎯 Article-specific JSON-LD found:');
      try {
        const parsed = JSON.parse(articleScript);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('❌ Could not parse Article JSON-LD:', e.message);
      }
    } else {
      console.log('\n❌ No Article-specific JSON-LD found');
    }
    
    // Check console messages
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('Article JSON-LD') || msg.text().includes('🎯')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Refresh to capture console logs
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log('\n📝 Console logs related to Article JSON-LD:');
      consoleLogs.forEach(log => console.log('   ', log));
    }
    
  } catch (error) {
    console.error('❌ Error testing page source:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testPageSource();
