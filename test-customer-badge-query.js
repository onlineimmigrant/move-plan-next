const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCustomerBadgeQuery() {
  const testEmail = 'nastassia@onlineimmigrant.com'; // Use actual customer email from database
  const testUserId = 'test-user-123'; // Simulated user ID (won't be in viewed_by)

  console.log('🧪 Testing Customer Badge Query\n');
  console.log(`📧 Test Email: ${testEmail}`);
  console.log(`👤 Test User ID: ${testUserId}\n`);

  // Customer query - matching your hook's logic
  const { data, count, error } = await supabase
    .from('bookings')
    .select('id, viewed_by, customer_name, customer_email', { count: 'exact' })
    .eq('customer_email', testEmail)
    .not('viewed_by', 'cs', `["${testUserId}"]`);

  if (error) {
    console.error('❌ Query error:', error);
    return;
  }

  console.log('✅ Query successful!\n');
  console.log(`📊 Unviewed meetings count: ${count}`);
  console.log(`\n📋 Sample unviewed meetings:`);
  
  data?.slice(0, 5).forEach((meeting, i) => {
    console.log(`  ${i + 1}. ID: ${meeting.id.substring(0, 8)}...`);
    console.log(`     Customer: ${meeting.customer_name} (${meeting.customer_email})`);
    console.log(`     viewed_by: ${JSON.stringify(meeting.viewed_by)}`);
  });

  // Test what happens after viewing a meeting
  if (data && data.length > 0) {
    const firstMeeting = data[0];
    console.log(`\n🔄 Simulating marking first meeting as viewed...`);
    
    const viewedBy = Array.isArray(firstMeeting.viewed_by) ? firstMeeting.viewed_by : [];
    console.log(`   Before: viewed_by = ${JSON.stringify(viewedBy)}`);
    console.log(`   After:  viewed_by = ${JSON.stringify([...viewedBy, testUserId])}`);

    // Query again after hypothetically marking as viewed
    const { count: newCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('customer_email', testEmail)
      .not('viewed_by', 'cs', `["${testUserId}"]`);

    console.log(`\n   New count after marking as viewed: ${newCount} (should be ${count})`);
    console.log(`   After actual update would be: ${(count || 0) - 1}`);
  }

  console.log('\n✅ Test complete!');
}

testCustomerBadgeQuery();
