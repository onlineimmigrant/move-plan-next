const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies on bookings table...\n');
  
  // Query PostgreSQL system tables to get RLS policies
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE tablename = 'bookings'
      ORDER BY policyname;
    `
  });

  if (error) {
    console.log('⚠️  Cannot query pg_policies (expected), trying alternative method...\n');
    
    // Alternative: Check if RLS is enabled
    const { data: rlsStatus } = await supabase
      .from('bookings')
      .select('id')
      .limit(1);
    
    console.log('📊 RLS Status Check:');
    console.log('  - Can service role read bookings?', rlsStatus ? 'YES' : 'NO');
    console.log('  - Sample booking ID:', rlsStatus?.[0]?.id);
    
    return;
  }

  if (data && data.length > 0) {
    console.log('📋 RLS Policies found:');
    data.forEach(policy => {
      console.log(`\n  Policy: ${policy.policyname}`);
      console.log(`    Command: ${policy.cmd}`);
      console.log(`    Roles: ${policy.roles}`);
      console.log(`    Using: ${policy.qual}`);
    });
  } else {
    console.log('⚠️  No RLS policies found on bookings table');
  }
}

checkRLSPolicies();
