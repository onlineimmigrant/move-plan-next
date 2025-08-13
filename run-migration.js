#!/usr/bin/env node

/**
 * Run database migration for products table
 * Usage: node run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (for admin operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🔄 Running products table migration...');
    
    // Read the migration file
    // Load and display pricingplan table migration
    const pricingplanMigrationPath = path.join(__dirname, 'database', 'migrations', '005_create_pricingplan_table.sql');
    const pricingplanMigrationSQL = fs.readFileSync(pricingplanMigrationPath, 'utf8');
    
    // Load and display annual_size_discount migration
    const annualDiscountMigrationPath = path.join(__dirname, 'database', 'migrations', '006_add_annual_size_discount_to_pricingplan.sql');
    const annualDiscountMigrationSQL = fs.readFileSync(annualDiscountMigrationPath, 'utf8');
    
    console.log('📝 Migration SQL loaded');
    console.log('⚠️  Please run this SQL manually in your Supabase SQL editor:');
    console.log('');
    console.log('===== PRICINGPLAN TABLE MIGRATION =====');
    console.log(pricingplanMigrationSQL);
    console.log('');
    console.log('===== ANNUAL SIZE DISCOUNT MIGRATION =====');
    console.log(annualDiscountMigrationSQL);
    console.log('=====================================');
    console.log('');
    
    console.log('🎯 After running the SQL in Supabase, test the API at:');
    console.log('   http://localhost:3001/api/pricing-comparison-products?organizationId=1');
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  }
}

// If this is run as a direct script, execute the migration
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
