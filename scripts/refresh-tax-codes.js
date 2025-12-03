#!/usr/bin/env node
// Refresh Stripe product tax codes into src/components/tax_codes.json
// Uses STRIPE_SECRET_KEY from environment

const fs = require('fs');
const path = require('path');

async function main() {
  // Load .env for local execution
  try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  } catch {}

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error('Missing STRIPE_SECRET_KEY in environment.');
    process.exit(1);
  }
  let Stripe;
  try {
    Stripe = require('stripe');
  } catch (e) {
    console.error('The "stripe" package is not installed. Run: npm install stripe');
    process.exit(1);
  }
  const stripe = new Stripe(secret); // use SDK default API version

  console.log('Fetching Stripe tax codes...');
  const taxCodes = await stripe.taxCodes
    .list({ limit: 100 })
    .autoPagingToArray({ limit: 1000 });

  // Map to our JSON shape
  const records = taxCodes.map((tc) => ({
    product_tax_code: tc.id,
    description: tc.description || tc.name || '',
    tax_category: tc.product_type || 'general',
  }));

  const outPath = path.join(__dirname, '..', 'src', 'components', 'tax_codes.json');
  fs.writeFileSync(outPath, JSON.stringify(records, null, 2) + '\n');
  console.log(`Wrote ${records.length} tax codes to ${outPath}`);
}

main().catch((err) => {
  console.error('Failed to refresh tax codes:', err);
  process.exit(1);
});
