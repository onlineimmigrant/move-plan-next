#!/usr/bin/env node

/**
 * One-time R2 CORS sync script
 * Syncs Cloudflare R2 CORS with all existing organizations
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getAllOrganizationDomains() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('id, domains, base_url');

  if (error) {
    console.error('❌ Failed to fetch organizations:', error);
    return [];
  }

  console.log(`\n📊 Found ${organizations.length} organizations\n`);

  const allDomains = new Set();

  organizations.forEach((org, idx) => {
    console.log(`Organization ${idx + 1}:`);
    console.log(`  ID: ${org.id}`);
    
    // Add domains from domains array
    if (org.domains && Array.isArray(org.domains)) {
      org.domains.forEach((domain) => {
        if (domain) {
          // Check if domain already has protocol
          const cleanDomain = domain.replace(/^https?:\/\//, '');
          
          allDomains.add(`https://${cleanDomain}`);
          // Only add www variant if not already starting with www
          if (!cleanDomain.startsWith('www.')) {
            allDomains.add(`https://www.${cleanDomain}`);
            // Add wildcard for subdomains (but not for www)
            allDomains.add(`https://*.${cleanDomain}`);
          }
          console.log(`    + ${domain}`);
        }
      });
    }

    // Add base_url
    if (org.base_url) {
      allDomains.add(org.base_url);
      console.log(`    + ${org.base_url}`);
    }
    
    console.log('');
  });

  // Always include localhost for development
  allDomains.add('http://localhost:3000');
  allDomains.add('http://localhost:3001');

  return Array.from(allDomains).filter(Boolean);
}

async function updateR2CORS(allowedOrigins) {
  // Use Cloudflare R2 API format: rules.allowed.origins
  const corsConfig = {
    rules: [
      {
        allowed: {
          origins: allowedOrigins,
          methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/cors`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(corsConfig),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('❌ Failed to update CORS:', result);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error updating CORS:', error);
    return false;
  }
}

async function main() {
  console.log('====================================');
  console.log('R2 CORS Sync - All Organizations');
  console.log('====================================');

  // Validate environment
  if (!CLOUDFLARE_API_TOKEN || !R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
    console.error('❌ Missing Cloudflare environment variables');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  // Fetch all domains
  console.log('🔍 Fetching organization domains...');
  const domains = await getAllOrganizationDomains();

  if (domains.length === 0) {
    console.error('❌ No domains found to configure');
    process.exit(1);
  }

  console.log(`\n✅ Collected ${domains.length} unique domains/origins\n`);
  console.log('Domains to add to CORS:');
  domains.forEach((domain) => console.log(`  - ${domain}`));

  // Update CORS
  console.log('\n🔄 Updating Cloudflare R2 CORS...');
  const success = await updateR2CORS(domains);

  if (success) {
    console.log('\n✅ SUCCESS! R2 CORS updated with all organization domains');
    console.log('\n📝 Summary:');
    console.log(`  Bucket: ${R2_BUCKET_NAME}`);
    console.log(`  Total Origins: ${domains.length}`);
    console.log(`  Methods: GET, HEAD, PUT, POST, DELETE`);
    console.log(`  Cache: 1 hour (3600s)`);
    console.log('\n⏳ CORS changes may take 1-2 minutes to propagate');
    console.log('🎬 Test video playback after propagation\n');
  } else {
    console.log('\n❌ Failed to update CORS');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
