const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectBookings() {
  console.log('🔍 Inspecting bookings table structure...\n');
  
  // Get a sample booking to see the structure
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('📋 Sample booking structure:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\n✅ Fields present:', Object.keys(data[0]).join(', '));
  } else {
    console.log('⚠️  No bookings found in database');
  }

  // Check if viewed_by column exists
  const { data: withViewedBy } = await supabase
    .from('bookings')
    .select('id, viewed_by')
    .limit(1);

  if (withViewedBy) {
    console.log('\n✅ viewed_by column exists!');
    console.log('Sample viewed_by value:', withViewedBy[0]?.viewed_by);
  }
}

inspectBookings();
