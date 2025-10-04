#!/usr/bin/env node

/**
 * Script to mark existing blog_post and faq items as Help Center content
 * 
 * Usage:
 *   node scripts/mark-help-center-content.js
 * 
 * This script helps you:
 * 1. List all available articles and FAQs
 * 2. Mark specific items to appear in Help Center
 * 3. Set display order and categories
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function listArticles(organizationId) {
  const { data, error } = await supabase
    .from('blog_post')
    .select('id, title, slug, subsection, is_help_center, help_center_order')
    .eq('organization_id', organizationId)
    .eq('display_this_post', true)
    .order('created_on', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  return data || [];
}

async function listFAQs(organizationId) {
  const { data, error } = await supabase
    .from('faq')
    .select('id, question, section, is_help_center, help_center_order')
    .eq('organization_id', organizationId)
    .order('order', { ascending: true })
    .limit(50);

  if (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }

  return data || [];
}

async function markArticleAsHelpCenter(articleId, order) {
  const { error } = await supabase
    .from('blog_post')
    .update({
      is_help_center: true,
      help_center_order: order
    })
    .eq('id', articleId);

  if (error) {
    console.error('Error updating article:', error);
    return false;
  }

  return true;
}

async function markFAQAsHelpCenter(faqId, order) {
  const { error } = await supabase
    .from('faq')
    .update({
      is_help_center: true,
      help_center_order: order
    })
    .eq('id', faqId);

  if (error) {
    console.error('Error updating FAQ:', error);
    return false;
  }

  return true;
}

async function unmarkArticle(articleId) {
  const { error } = await supabase
    .from('blog_post')
    .update({
      is_help_center: false,
      help_center_order: 0
    })
    .eq('id', articleId);

  return !error;
}

async function unmarkFAQ(faqId) {
  const { error } = await supabase
    .from('faq')
    .update({
      is_help_center: false,
      help_center_order: 0
    })
    .eq('id', faqId);

  return !error;
}

async function main() {
  console.log('🎯 Help Center Content Manager\n');
  console.log('This tool helps you manage which articles and FAQs appear in your Help Center.\n');

  const organizationId = await question('Enter your Organization ID: ');
  
  if (!organizationId.trim()) {
    console.log('❌ Organization ID is required');
    rl.close();
    return;
  }

  while (true) {
    console.log('\n📋 Main Menu:');
    console.log('1. Manage Articles');
    console.log('2. Manage FAQs');
    console.log('3. View Help Center Items');
    console.log('4. Exit');
    
    const choice = await question('\nSelect option (1-4): ');

    switch (choice.trim()) {
      case '1':
        await manageArticles(organizationId);
        break;
      case '2':
        await manageFAQs(organizationId);
        break;
      case '3':
        await viewHelpCenterItems(organizationId);
        break;
      case '4':
        console.log('👋 Goodbye!');
        rl.close();
        return;
      default:
        console.log('❌ Invalid option');
    }
  }
}

async function manageArticles(organizationId) {
  const articles = await listArticles(organizationId);
  
  if (articles.length === 0) {
    console.log('📭 No articles found');
    return;
  }

  console.log('\n📚 Available Articles:\n');
  articles.forEach((article, index) => {
    const status = article.is_help_center ? '✓' : ' ';
    const order = article.is_help_center ? ` [Order: ${article.help_center_order}]` : '';
    console.log(`${index + 1}. [${status}] ${article.title}${order}`);
  });

  const selection = await question('\nEnter article number to toggle (or "back"): ');
  
  if (selection.toLowerCase() === 'back') return;
  
  const articleIndex = parseInt(selection) - 1;
  
  if (articleIndex < 0 || articleIndex >= articles.length) {
    console.log('❌ Invalid selection');
    return;
  }

  const article = articles[articleIndex];
  
  if (article.is_help_center) {
    const confirm = await question(`Remove "${article.title}" from Help Center? (yes/no): `);
    if (confirm.toLowerCase() === 'yes') {
      if (await unmarkArticle(article.id)) {
        console.log('✅ Article removed from Help Center');
      } else {
        console.log('❌ Failed to update article');
      }
    }
  } else {
    const order = await question('Display order (lower appears first, e.g., 1, 2, 3): ');
    
    if (await markArticleAsHelpCenter(article.id, parseInt(order) || 0)) {
      console.log('✅ Article added to Help Center');
    } else {
      console.log('❌ Failed to update article');
    }
  }
}

async function manageFAQs(organizationId) {
  const faqs = await listFAQs(organizationId);
  
  if (faqs.length === 0) {
    console.log('📭 No FAQs found');
    return;
  }

  console.log('\n❓ Available FAQs:\n');
  faqs.forEach((faq, index) => {
    const status = faq.is_help_center ? '✓' : ' ';
    const order = faq.is_help_center ? ` [Order: ${faq.help_center_order}]` : '';
    console.log(`${index + 1}. [${status}] ${faq.question}${order}`);
  });

  const selection = await question('\nEnter FAQ number to toggle (or "back"): ');
  
  if (selection.toLowerCase() === 'back') return;
  
  const faqIndex = parseInt(selection) - 1;
  
  if (faqIndex < 0 || faqIndex >= faqs.length) {
    console.log('❌ Invalid selection');
    return;
  }

  const faq = faqs[faqIndex];
  
  if (faq.is_help_center) {
    const confirm = await question(`Remove "${faq.question}" from Help Center? (yes/no): `);
    if (confirm.toLowerCase() === 'yes') {
      if (await unmarkFAQ(faq.id)) {
        console.log('✅ FAQ removed from Help Center');
      } else {
        console.log('❌ Failed to update FAQ');
      }
    }
  } else {
    const order = await question('Display order (lower appears first, e.g., 1, 2, 3): ');
    
    if (await markFAQAsHelpCenter(faq.id, parseInt(order) || 0)) {
      console.log('✅ FAQ added to Help Center');
    } else {
      console.log('❌ Failed to update FAQ');
    }
  }
}

async function viewHelpCenterItems(organizationId) {
  console.log('\n🎯 Current Help Center Items:\n');
  
  const { data: articles } = await supabase
    .from('blog_post')
    .select('title, help_center_order')
    .eq('organization_id', organizationId)
    .eq('is_help_center', true)
    .order('help_center_order', { ascending: true });

  const { data: faqs } = await supabase
    .from('faq')
    .select('question, help_center_order')
    .eq('organization_id', organizationId)
    .eq('is_help_center', true)
    .order('help_center_order', { ascending: true });

  console.log('📚 Articles:');
  if (articles && articles.length > 0) {
    articles.forEach((article, index) => {
      console.log(`  ${index + 1}. [${article.help_center_order}] ${article.title}`);
    });
  } else {
    console.log('  No articles marked for Help Center');
  }

  console.log('\n❓ FAQs:');
  if (faqs && faqs.length > 0) {
    faqs.forEach((faq, index) => {
      console.log(`  ${index + 1}. [${faq.help_center_order}] ${faq.question}`);
    });
  } else {
    console.log('  No FAQs marked for Help Center');
  }

  await question('\nPress Enter to continue...');
}

main().catch(console.error);
