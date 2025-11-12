const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCustomerIds() {
  console.log('🔍 Checking customer_id population...\n');
  
  // Count bookings with customer_id
  const { count: withCustomerId } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .not('customer_id', 'is', null);

  // Count bookings without customer_id
  const { count: withoutCustomerId } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .is('customer_id', null);

  // Count bookings with customer_email
  const { count: withEmail } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .not('customer_email', 'is', null);

  console.log('📊 Statistics:');
  console.log(`  - Bookings WITH customer_id: ${withCustomerId || 0}`);
  console.log(`  - Bookings WITHOUT customer_id (NULL): ${withoutCustomerId || 0}`);
  console.log(`  - Bookings with customer_email: ${withEmail || 0}`);

  // Get a few examples
  const { data: samples } = await supabase
    .from('bookings')
    .select('id, customer_id, customer_email, customer_name')
    .limit(5);

  console.log('\n📋 Sample bookings:');
  samples?.forEach((b, i) => {
    console.log(`  ${i + 1}. customer_id: ${b.customer_id || 'NULL'}, email: ${b.customer_email}, name: ${b.customer_name}`);
  });
}

checkCustomerIds();
