import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log('Organization creation API called');
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    console.log('User verification:', { user: user?.user?.id, error: userError });
    
    if (userError || !user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;
    const body = await request.json();
    console.log('Request body:', body);
    
    const { name, type } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // Validate organization type - exclude 'general' from allowed types
    const validTypes = ['immigration', 'solicitor', 'finance', 'education', 'job', 'beauty', 'doctor', 'services'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid organization type. General type is not allowed for creation.' }, { status: 400 });
    }

    // Check user's profile and permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator')
      .eq('id', userId)
      .single();

    console.log('Profile query result:', { profile, profileError });

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user has site creation permissions
    console.log('Checking site creation permissions:', profile.is_site_creator);
    if (!profile.is_site_creator) {
      return NextResponse.json({ error: 'User does not have site creation permissions' }, { status: 403 });
    }

    // Check if user's current organization is 'general' type
    if (!profile.organization_id) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const { data: currentOrg, error: orgError } = await supabase
      .from('organizations')
      .select('type')
      .eq('id', profile.organization_id)
      .single();

    console.log('Current organization check:', { currentOrg, orgError });
    
    if (orgError || !currentOrg) {
      return NextResponse.json({ error: 'Could not verify current organization' }, { status: 500 });
    }

    if (currentOrg.type !== 'general') {
      return NextResponse.json({ error: 'Only users in general organizations can create new sites' }, { status: 403 });
    }

    // Check creation limit for users with is_site_creator = true (they can create only one organization)
    if (profile.is_site_creator && profile.role !== 'admin') {
      const { data: existingOrgs, error: existingError } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by_email', user.user.email);

      console.log('Existing organizations check:', { existingOrgs, existingError, userEmail: user.user.email });

      if (existingError) {
        return NextResponse.json({ error: 'Error checking existing organizations' }, { status: 500 });
      }

      if (existingOrgs && existingOrgs.length > 0) {
        return NextResponse.json({ error: 'Users with site creator permissions can only create one organization' }, { status: 403 });
      }
    }

    // Find the next available port for local URL
    const { data: allOrgs, error: portError } = await supabase
      .from('organizations')
      .select('base_url_local')
      .order('created_at', { ascending: true });

    if (portError) {
      return NextResponse.json({ error: 'Error checking existing organizations' }, { status: 500 });
    }

    let nextPort = 3100;
    if (allOrgs && allOrgs.length > 0) {
      const usedPorts = allOrgs
        .map(org => {
          const match = org.base_url_local?.match(/:(\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter(port => port !== null)
        .sort((a, b) => a! - b!);

      if (usedPorts.length > 0) {
        nextPort = Math.max(...usedPorts as number[]) + 1;
      }
    }

    const baseUrlLocal = `http://localhost:${nextPort}`;

    // Create the new organization with creator's email
    console.log('Creating organization with data:', {
      name,
      type,
      base_url_local: baseUrlLocal,
      base_url: null,
      created_by_email: user.user.email
    });
    
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        name,
        type,
        base_url_local: baseUrlLocal,
        base_url: null, // Will be filled later when deployed
        created_by_email: user.user.email
      })
      .select()
      .single();

    console.log('Organization creation result:', { newOrg, createError });

    if (createError) {
      console.error('Failed to create organization:', createError);
      return NextResponse.json({ error: 'Failed to create organization', details: createError.message }, { status: 500 });
    }

    // Create default settings record for the new organization
    const { data: newSettings, error: settingsError } = await supabase
      .from('settings')
      .insert({
        organization_id: newOrg.id,
        site: newOrg.name, // Default site field to organization name
        // Add other default fields as needed
      })
      .select()
      .single();

    console.log('Settings creation result:', { newSettings, settingsError });

    if (settingsError) {
      console.error('Failed to create settings:', settingsError);
      // Note: Organization was created successfully, but settings failed
      console.warn('Organization created but settings creation failed. Manual settings creation may be required.');
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        type: newOrg.type,
        base_url_local: newOrg.base_url_local,
        base_url: newOrg.base_url
      },
      settings: newSettings || null
    });

  } catch (error) {
    console.error('Organization creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
