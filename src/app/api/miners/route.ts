import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Get URL parameters to check if this is an admin request
    const { searchParams } = new URL(request.url);
    const isAdminRequest = searchParams.get('admin') === 'true';
    
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
    
    // Log authentication attempt for debugging
    console.log('🔐 Attempting authentication for miners API...', { hasToken: !!token });
    
    // Restore authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    console.log('🔐 Auth result:', { 
      user: user?.id, 
      email: user?.email,
      error: userError?.message 
    });
    
    if (userError || !user) {
      console.log('❌ Authentication failed:', userError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated successfully');

    // Get user profile to check role and organization
    console.log('🔍 Fetching profile for user:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    console.log('✅ Found profile:', { organization_id: profile.organization_id, role: profile.role });

    // Verify organization is a miner type
    console.log('🔍 Verifying organization:', profile.organization_id);
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, type')
      .eq('id', profile.organization_id)
      .eq('type', 'miner')
      .single();
      
    if (orgError || !org) {
      console.error('❌ Organization error:', orgError);
      return NextResponse.json({ error: 'Invalid organization or not a mining organization' }, { status: 403 });
    }

    console.log('✅ Valid organization found:', org);

    // Additional debug: Let's also check what miners exist globally to see if there's an org mismatch
    console.log('🔍 DEBUG: Checking all miners in database...');
    const { data: allMiners, error: allMinersError } = await supabase
      .from('miners')
      .select('id, serial_number, user_id, organization_id')
      .limit(10);
    
    if (!allMinersError && allMiners) {
      console.log('🔍 All miners in database (limited to 10):', allMiners);
      console.log('🔍 Looking for org_id:', org.id);
      console.log('🔍 Looking for user_id:', user.id);
    }

    // Query miners based on access level
    console.log('🔍 Querying miners for organization:', org.id, 'isAdminRequest:', isAdminRequest, 'userRole:', profile.role);
    
    // Start with a simple query first
    let minersQuery = supabase
      .from('miners')
      .select('*')
      .eq('organization_id', org.id);

    // If this is not an admin request or user is not admin, filter by user_id
    if (!isAdminRequest || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      console.log('🔒 Filtering by user_id (regular user):', user.id);
      minersQuery = minersQuery.eq('user_id', user.id);
    } else {
      console.log('🔓 Admin request - showing all organization miners');
    }

    const { data: miners, error } = await minersQuery;
    
    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ 
        error: 'Failed to fetch miners',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Successfully fetched', miners?.length || 0, 'miners from database');
    
    if (miners && miners.length > 0) {
      console.log('📋 Miners found:', miners.map(m => ({ 
        id: m.id, 
        serial: m.serial_number, 
        user_id: m.user_id, 
        org_id: m.organization_id 
      })));
    } else {
      console.log('❌ No miners found. Let me check what miners exist in this organization...');
      
      // Debug query - check all miners in organization regardless of user
      const { data: allOrgMiners, error: debugError } = await supabase
        .from('miners')
        .select('id, serial_number, user_id, organization_id')
        .eq('organization_id', org.id);
        
      if (!debugError && allOrgMiners) {
        console.log('🔍 All miners in organization:', allOrgMiners);
        console.log('🔍 Current user ID:', user.id);
        console.log('🔍 Admin request:', isAdminRequest);
        console.log('🔍 User role:', profile.role);
      } else {
        console.log('❌ Debug query failed:', debugError);
      }
    }

    // For admin requests, fetch user profile information separately
    let enrichedMiners = miners || [];
    if (isAdminRequest && (profile.role === 'admin' || profile.role === 'superadmin') && miners && miners.length > 0) {
      console.log('🔍 Fetching user profiles for admin view...');
      
      // Get unique user IDs
      const userIds = [...new Set(miners.map(m => m.user_id))];
      
      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
        
      if (!profilesError && profiles) {
        // Create a map for quick lookup
        const profileMap = new Map(profiles.map(p => [p.id, p]));
        
        // Enrich miners with profile data
        enrichedMiners = miners.map(miner => ({
          ...miner,
          profiles: profileMap.get(miner.user_id) || null
        }));
        
        console.log('✅ Successfully enriched miners with profile data');
      } else {
        console.warn('⚠️ Failed to fetch profiles:', profilesError);
      }
    }

    // Process miners for hardware stats if they exist
    const updatedMiners = await Promise.all(
      enrichedMiners.map(async (miner) => {
        try {
          const { data } = await axios.get(`http://${miner.ip_address}:3000/stats`, { timeout: 5000 });
          return {
            ...miner,
            hashrate: data.hashrate / 1e12, // Convert H/s to TH/s
            temperature: data.temperature,
            profit: data.profit,
            power: data.power,
            efficiency: data.efficiency,
            status: data.hashrate > 0 ? 'online' : 'offline',
            last_updated: new Date().toISOString(),
          };
        } catch {
          return {
            ...miner,
            status: 'offline',
            last_updated: new Date().toISOString(),
          };
        }
      })
    );

    // Update Supabase with latest miner data (skip status field if it doesn't exist)
    if (miners && miners.length > 0) {
      await Promise.all(
        updatedMiners.map((miner) =>
          supabase
            .from('miners')
            .update({
              hashrate: miner.hashrate,
              temperature: miner.temperature,
              profit: miner.profit,
              power: miner.power,
              efficiency: miner.efficiency,
              last_updated: miner.last_updated,
            })
            .eq('id', miner.id)
        )
      );
    }

    console.log('9. Returning', updatedMiners.length, 'miners successfully');
    return NextResponse.json(updatedMiners);
  } catch (error) {
    console.error('=== MINERS API ERROR ===', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch miners';
    const errorDetails = error instanceof Error ? error.stack : 'Unknown error';
    
    console.error('Error details:', { message: errorMessage, stack: errorDetails });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}