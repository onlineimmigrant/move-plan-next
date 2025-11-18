#!/usr/bin/env node

/**
 * Generate CORS Configuration for Manual Setup
 * Outputs the exact domains that need to be added to Cloudflare R2 CORS
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

  const allDomains = new Set();

  organizations.forEach((org) => {
    if (org.domains && Array.isArray(org.domains)) {
      org.domains.forEach((domain) => {
        if (domain) {
          const cleanDomain = domain.replace(/^https?:\/\//, '');
          allDomains.add(`https://${cleanDomain}`);
          if (!cleanDomain.startsWith('www.')) {
            allDomains.add(`https://www.${cleanDomain}`);
            allDomains.add(`https://*.${cleanDomain}`);
          }
        }
      });
    }
    if (org.base_url) allDomains.add(org.base_url);
  });

  allDomains.add('http://localhost:3000');
  allDomains.add('http://localhost:3001');

  return Array.from(allDomains).filter(Boolean);
}

async function main() {
  console.log('========================================');
  console.log('R2 CORS Configuration Generator');
  console.log('========================================\n');

  const domains = await getAllOrganizationDomains();

  const corsConfig = [
    {
      AllowedOrigins: domains,
      AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type', 'Content-Range', 'Accept-Ranges'],
      MaxAgeSeconds: 3600,
    },
  ];

  const jsonConfig = JSON.stringify(corsConfig, null, 2);

  // Save to file
  fs.writeFileSync('r2-cors-config.json', jsonConfig);

  console.log(`✅ Found ${domains.length} unique domains\n`);
  console.log('📄 CORS configuration saved to: r2-cors-config.json\n');
  console.log('📋 MANUAL SETUP INSTRUCTIONS:\n');
  console.log('1. Go to: https://dash.cloudflare.com/');
  console.log('2. Navigate to: R2 → product-videos → Settings');
  console.log('3. Scroll to: CORS Policy');
  console.log('4. Click: Add CORS Policy or Edit');
  console.log('5. Copy the contents of r2-cors-config.json');
  console.log('6. Paste into the CORS configuration field');
  console.log('7. Click: Save\n');
  console.log('========================================\n');
  console.log('Domains to allow:');
  domains.forEach((d, idx) => console.log(`  ${idx + 1}. ${d}`));
  console.log('\n========================================\n');
}

main().catch(console.error);
