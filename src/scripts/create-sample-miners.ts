import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - you'll need to run this while logged in as admin
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function createSampleMiners() {
  try {
    // First, let's get an organization with type 'miner'
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('type', 'miner')
      .limit(1)
      .single();

    if (orgError || !organization) {
      console.error('No miner organization found:', orgError);
      return;
    }

    console.log('Found miner organization:', organization.id);

    // Get admin users from this organization
    const { data: adminUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('organization_id', organization.id)
      .eq('role', 'admin')
      .limit(1);

    if (usersError || !adminUsers || adminUsers.length === 0) {
      console.error('No admin users found for organization:', usersError);
      return;
    }

    const adminUserId = adminUsers[0].id;
    console.log('Using admin user:', adminUserId);

    // Create sample miners data
    const sampleMiners = [
      {
        serial_number: 'ANTMINER-S19-001',
        ip_address: '192.168.1.100',
        hashrate: 95.5, // TH/s
        power: 3250, // W
        efficiency: 34.1, // J/TH
        temperature: 65, // °C
        uptime: 95.2, // %
        profit: 15.30, // $/day
        status: 'online',
        user_id: adminUserId,
        organization_id: organization.id,
        last_updated: new Date().toISOString()
      },
      {
        serial_number: 'ANTMINER-S19-002',
        ip_address: '192.168.1.101',
        hashrate: 92.1, // TH/s
        power: 3180, // W
        efficiency: 34.6, // J/TH
        temperature: 68, // °C
        uptime: 87.8, // %
        profit: 14.85, // $/day
        status: 'online',
        user_id: adminUserId,
        organization_id: organization.id,
        last_updated: new Date().toISOString()
      },
      {
        serial_number: 'ANTMINER-S19-003',
        ip_address: '192.168.1.102',
        hashrate: 0, // TH/s - offline
        power: 0, // W
        efficiency: null, // J/TH
        temperature: null, // °C
        uptime: 0, // %
        profit: 0, // $/day
        status: 'offline',
        user_id: adminUserId,
        organization_id: organization.id,
        last_updated: new Date().toISOString()
      },
      {
        serial_number: 'WHATSMINER-M30S-001',
        ip_address: '192.168.1.103',
        hashrate: 88.2, // TH/s
        power: 3472, // W
        efficiency: 39.4, // J/TH
        temperature: 70, // °C
        uptime: 92.5, // %
        profit: 13.95, // $/day
        status: 'online',
        user_id: adminUserId,
        organization_id: organization.id,
        last_updated: new Date().toISOString()
      },
      {
        serial_number: 'AVALON-A1246-001',
        ip_address: '192.168.1.104',
        hashrate: 82.5, // TH/s
        power: 3420, // W
        efficiency: 41.5, // J/TH
        temperature: 72, // °C
        uptime: 88.9, // %
        profit: 12.75, // $/day
        status: 'online',
        user_id: adminUserId,
        organization_id: organization.id,
        last_updated: new Date().toISOString()
      }
    ];

    // Check if miners already exist
    const { data: existingMiners, error: checkError } = await supabase
      .from('miners')
      .select('serial_number')
      .eq('organization_id', organization.id);

    if (checkError) {
      console.error('Error checking existing miners:', checkError);
      return;
    }

    const existingSerials = existingMiners?.map(m => m.serial_number) || [];
    const newMiners = sampleMiners.filter(m => !existingSerials.includes(m.serial_number));

    if (newMiners.length === 0) {
      console.log('All sample miners already exist in the database');
      return;
    }

    // Insert sample miners
    const { data, error } = await supabase
      .from('miners')
      .insert(newMiners)
      .select();

    if (error) {
      console.error('Error creating sample miners:', error);
      return;
    }

    console.log(`Successfully created ${newMiners.length} sample miners:`, data);
    console.log('Sample miners data:');
    newMiners.forEach(miner => {
      console.log(`- ${miner.serial_number} (${miner.ip_address}) - ${miner.status} - ${miner.hashrate} TH/s`);
    });

  } catch (error) {
    console.error('Script error:', error);
  }
}

// Run the script
createSampleMiners();
