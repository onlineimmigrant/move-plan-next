const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTicketAvatars() {
  console.log('\n=== Checking ticket_avatars Table ===\n');

  // First, check if table exists
  console.log('1. Checking if table exists...');
  const { data: tables, error: tableError } = await supabase
    .from('ticket_avatars')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('❌ Error accessing table:', tableError.message);
    console.log('\nThe table might not exist yet. You may need to run the migration.');
    return;
  }

  console.log('✅ Table exists!\n');

  // Get all avatars
  console.log('2. Fetching all avatars...');
  const { data: allAvatars, error: fetchError } = await supabase
    .from('ticket_avatars')
    .select('*');

  if (fetchError) {
    console.error('❌ Error fetching avatars:', fetchError.message);
    return;
  }

  console.log(`✅ Found ${allAvatars?.length || 0} avatars\n`);

  if (allAvatars && allAvatars.length > 0) {
    console.log('3. Avatar details:');
    allAvatars.forEach((avatar, index) => {
      console.log(`\n   Avatar ${index + 1}:`);
      console.log(`   - ID: ${avatar.id}`);
      console.log(`   - Title: ${avatar.title}`);
      console.log(`   - Full Name: ${avatar.full_name || 'N/A'}`);
      console.log(`   - Organization ID: ${avatar.organization_id}`);
      console.log(`   - Has Image: ${avatar.image ? 'Yes (' + avatar.image.substring(0, 50) + '...)' : 'No'}`);
      console.log(`   - Created: ${avatar.created_at}`);
    });

    // Get unique organization IDs
    const orgIds = [...new Set(allAvatars.map(a => a.organization_id))];
    console.log(`\n4. Unique organization IDs: ${orgIds.length}`);
    orgIds.forEach(id => {
      const count = allAvatars.filter(a => a.organization_id === id).length;
      console.log(`   - ${id}: ${count} avatar(s)`);
    });
  } else {
    console.log('⚠️  No avatars found in the database.');
    console.log('   You can create one through the "Manage Avatars" UI.');
  }

  console.log('\n=== Check Complete ===\n');
}

checkTicketAvatars().catch(console.error);
