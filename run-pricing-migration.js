// Script to run the pricing comparison migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    // Read and run the table creation migration
    const migrationPath1 = path.join(__dirname, '../database/migrations/002_pricing_plan_comparison.sql');
    const migration1 = fs.readFileSync(migrationPath1, 'utf8');
    
    console.log('Running table creation migration...');
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 });
    
    if (error1) {
      console.error('Error running table creation migration:', error1);
    } else {
      console.log('Table creation migration completed successfully');
    }

    // Read and run the data insertion migration
    const migrationPath2 = path.join(__dirname, '../database/migrations/003_insert_sample_pricing_data.sql');
    const migration2 = fs.readFileSync(migrationPath2, 'utf8');
    
    console.log('Running data insertion migration...');
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 });
    
    if (error2) {
      console.error('Error running data insertion migration:', error2);
    } else {
      console.log('Data insertion migration completed successfully');
    }

    // Verify the data was inserted
    console.log('Verifying data...');
    const { data, error } = await supabase
      .from('pricingplan_comparison')
      .select('*');
    
    if (error) {
      console.error('Error verifying data:', error);
    } else {
      console.log('Verification successful. Records found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample record:', JSON.stringify(data[0], null, 2));
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

runMigration();
