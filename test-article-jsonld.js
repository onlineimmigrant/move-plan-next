/**
 * Test Article JSON-LD Implementation
 * This script tests if Article JSON-LD structured data is properly injected
 * on post pages like /managing-subscriptions-and-payments
 */

const puppeteer = require('puppeteer');

async function testArticleJsonLd() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navigate to the test post
  await page.goto('http://localhost:3000/managing-subscriptions-and-payments');
  
  // Wait for the page to load and client-side scripts to execute
  await page.waitForTimeout(3000);
  
  // Check for Article JSON-LD script
  const articleJsonLd = await page.evaluate(() => {
    const script = document.querySelector('script[type="application/ld+json"][data-article="true"]');
    if (script) {
      try {
        return JSON.parse(script.textContent);
      } catch (e) {
        return { error: 'Invalid JSON', content: script.textContent };
      }
    }
    return null;
  });
  
  console.log('=== Article JSON-LD Test Results ===');
  
  if (articleJsonLd) {
    console.log('✅ Article JSON-LD script found!');
    console.log('📋 Article structured data:');
    console.log(JSON.stringify(articleJsonLd, null, 2));
    
    // Validate required fields
    const requiredFields = ['@context', '@type', 'headline', 'url', 'datePublished'];
    const missingFields = requiredFields.filter(field => !articleJsonLd[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ All required Article fields present');
    } else {
      console.log('❌ Missing required fields:', missingFields);
    }
    
    // Check for Google Search enhancements
    const enhancements = {
      author: !!articleJsonLd.author,
      publisher: !!articleJsonLd.publisher,
      image: !!articleJsonLd.image,
      wordCount: !!articleJsonLd.wordCount,
      keywords: !!articleJsonLd.keywords,
      reviews: !!articleJsonLd.review,
      faqs: !!articleJsonLd.mainEntity
    };
    
    console.log('🚀 Google Search Enhancements:');
    Object.entries(enhancements).forEach(([key, present]) => {
      console.log(`   ${present ? '✅' : '❌'} ${key}: ${present ? 'Present' : 'Missing'}`);
    });
    
  } else {
    console.log('❌ Article JSON-LD script not found');
    
    // Check what scripts are available
    const allScripts = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map(script => ({
        attributes: Array.from(script.attributes).map(attr => `${attr.name}="${attr.value}"`),
        content: script.textContent ? JSON.parse(script.textContent) : null
      }));
    });
    
    console.log('📄 Available JSON-LD scripts:');
    allScripts.forEach((script, index) => {
      console.log(`   Script ${index + 1}:`, script.attributes.join(' '));
      if (script.content && script.content['@type']) {
        console.log(`     Type: ${script.content['@type']}`);
      }
    });
  }
  
  await browser.close();
}

// Run the test
testArticleJsonLd().catch(console.error);
