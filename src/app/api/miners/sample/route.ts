import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Create Supabase client with token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    let supabase;
    if (token) {
      // Use token-based authentication if available
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
    } else {
      // Fallback to cookie-based authentication
      const { createSupabaseAIServerClient } = await import('@/lib/supabaseAI');
      supabase = await createSupabaseAIServerClient();
    }
    
    // Restore authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is authenticated and has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Verify organization is a miner type
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, type')
      .eq('id', profile.organization_id)
      .eq('type', 'miner')
      .single();
    
    if (orgError || !org) {
      return NextResponse.json({ error: 'Invalid organization or not a mining organization' }, { status: 403 });
    }

    console.log('Using organization:', org.id, 'and user:', user.id);

    // Check if miners already exist
    const { data: existingMiners, error: checkError } = await supabase
      .from('miners')
      .select('serial_number')
      .eq('organization_id', org.id);

    if (checkError) {
      console.error('Error checking existing miners:', checkError);
      return NextResponse.json({ error: 'Failed to check existing miners' }, { status: 500 });
    }

    // Create sample miners data with only fields that exist in the database
    const sampleMiners = [
      {
        serial_number: 'ANTMINER-S19-001',
        ip_address: '192.168.1.100',
        hashrate: 95.5, // TH/s
        power: 3250, // W
        efficiency: 34.1, // J/TH
        temperature: 65, // °C
        uptime: 95, // %
        profit: 15.30, // $/day
        user_id: user.id,
        organization_id: org.id
      },
      {
        serial_number: 'ANTMINER-S19-002',
        ip_address: '192.168.1.101',
        hashrate: 92.1, // TH/s
        power: 3180, // W
        efficiency: 34.6, // J/TH
        temperature: 68, // °C
        uptime: 88, // %
        profit: 14.85, // $/day
        user_id: user.id,
        organization_id: org.id
      },
      {
        serial_number: 'ANTMINER-S19-003',
        ip_address: '192.168.1.102',
        hashrate: 0, // TH/s - offline
        power: 0, // W
        efficiency: 0, // J/TH - offline, no efficiency
        temperature: 25, // °C - room temperature when offline
        uptime: 0, // %
        profit: 0, // $/day
        user_id: user.id,
        organization_id: org.id
      },
      {
        serial_number: 'WHATSMINER-M30S-001',
        ip_address: '192.168.1.103',
        hashrate: 88.2, // TH/s
        power: 3472, // W
        efficiency: 39.4, // J/TH
        temperature: 70, // °C
        uptime: 93, // %
        profit: 13.95, // $/day
        user_id: user.id,
        organization_id: org.id
      },
      {
        serial_number: 'AVALON-A1246-001',
        ip_address: '192.168.1.104',
        hashrate: 82.5, // TH/s
        power: 3420, // W
        efficiency: 41.5, // J/TH
        temperature: 72, // °C
        uptime: 89, // %
        profit: 12.75, // $/day
        user_id: user.id,
        organization_id: org.id
      }
    ];

    const existingSerials = existingMiners?.map(m => m.serial_number) || [];
    const newMiners = sampleMiners.filter(m => !existingSerials.includes(m.serial_number));

    if (newMiners.length === 0) {
      return NextResponse.json({ 
        message: 'All sample miners already exist', 
        existingCount: existingMiners?.length || 0 
      });
    }

    // Insert sample miners
    const { data, error } = await supabase
      .from('miners')
      .insert(newMiners)
      .select();

    if (error) {
      console.error('Error creating sample miners:', error);
      return NextResponse.json({ error: `Failed to create sample miners: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Successfully created ${newMiners.length} sample miners`,
      created: data,
      total: (existingMiners?.length || 0) + newMiners.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
