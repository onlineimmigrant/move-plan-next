import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch organization details with settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties
    const { id } = await params;
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;
    const orgId = id;

    console.log('Fetching organization details for:', orgId, 'by user:', userId);

    // Get user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user's organization is 'general' type
    if (!profile.organization_id) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const { data: currentOrg, error: currentOrgError } = await supabase
      .from('organizations')
      .select('type')
      .eq('id', profile.organization_id)
      .single();

    if (currentOrgError || !currentOrg) {
      return NextResponse.json({ error: 'Could not verify organization' }, { status: 500 });
    }

    console.log('User organization type:', currentOrg.type, 'Requested org ID:', orgId, 'User org ID:', profile.organization_id);

    // Fetch the target organization first
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (currentOrg.type === 'general') {
      // GENERAL ORGANIZATION LOGIC (existing logic)
      // Only admins can edit organizations
      if (profile.role !== 'admin') {
        return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
      }

      // Check if this organization was created by someone from the current general organization
      const { data: generalOrgUsers, error: usersError } = await supabase
        .from('profiles')
        .select('email')
        .eq('organization_id', profile.organization_id)
        .or('role.eq.admin,is_site_creator.eq.true');

      if (usersError) {
        return NextResponse.json({ error: 'Error verifying permissions' }, { status: 500 });
      }

      const creatorEmails = generalOrgUsers?.map((user: any) => user.email) || [];
      if (!creatorEmails.includes(organization.created_by_email)) {
        return NextResponse.json({ error: 'Access denied. You can only edit organizations created by your team.' }, { status: 403 });
      }
    } else {
      // NON-GENERAL ORGANIZATION LOGIC (new)
      // Users can only access their own organization
      if (orgId !== profile.organization_id) {
        return NextResponse.json({ error: 'Access denied. You can only access your own organization.' }, { status: 403 });
      }

      // Check if user has appropriate role (admin or member with edit permissions)
      if (profile.role !== 'admin' && profile.role !== 'member') {
        return NextResponse.json({ error: 'Access denied. Insufficient permissions.' }, { status: 403 });
      }
    }

    // Fetch the organization's settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 });
    }

    return NextResponse.json({
      organization,
      settings: settings || null
    });

  } catch (error) {
    console.error('Error fetching organization details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update organization and settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('PUT /api/organizations/[id] - Starting request');
  
  try {
    // Await params before accessing properties
    const { id } = await params;
    console.log('PUT - Organization ID:', id);
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('PUT - No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user.user) {
      console.log('PUT - Invalid token:', userError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;
    const orgId = id;
    const body = await request.json();

    console.log('PUT - Updating organization:', orgId, 'with data:', body);
    console.log('PUT - User ID:', userId);

    const { organization: orgData, settings: settingsData } = body;

    // Get user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator')
      .eq('id', userId)
      .single();

    console.log('PUT - Profile fetch result:', { profile, profileError });

    if (profileError || !profile) {
      console.log('PUT - Profile not found:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check permissions (same as GET)
    if (!profile.organization_id) {
      console.log('PUT - User has no organization_id');
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const { data: currentOrg, error: currentOrgError } = await supabase
      .from('organizations')
      .select('type')
      .eq('id', profile.organization_id)
      .single();

    console.log('PUT - Current org fetch result:', { currentOrg, currentOrgError });

    if (currentOrgError || !currentOrg) {
      console.log('PUT - Current organization not found:', currentOrgError);
      return NextResponse.json({ error: 'Current organization not found' }, { status: 404 });
    }

    console.log('PUT - Access control check:', {
      currentOrgType: currentOrg.type,
      userRole: profile.role,
      userOrgId: profile.organization_id,
      targetOrgId: orgId
    });

    // Access control based on organization type
    if (currentOrg.type === 'general') {
      // General organizations: check admin role
      console.log('PUT - General org access control');
      if (profile.role !== 'admin') {
        console.log('PUT - Access denied: not admin');
        return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
      }
    } else {
      // Non-general organizations: check if editing their own organization
      console.log('PUT - Non-general org access control');
      if (profile.organization_id !== orgId) {
        console.log('PUT - Access denied: not own organization');
        return NextResponse.json({ error: 'Access denied. You can only edit your own organization.' }, { status: 403 });
      }
      // For non-general orgs, any member can edit their own org
    }

    // Verify user can edit this organization
    const { data: targetOrg, error: targetOrgError } = await supabase
      .from('organizations')
      .select('created_by_email')
      .eq('id', orgId)
      .single();

    if (targetOrgError) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Additional permission check only for general organizations
    if (currentOrg.type === 'general') {
      const { data: generalOrgUsers, error: usersError } = await supabase
        .from('profiles')
        .select('email')
        .eq('organization_id', profile.organization_id)
        .or('role.eq.admin,is_site_creator.eq.true');

      if (usersError) {
        return NextResponse.json({ error: 'Error verifying permissions' }, { status: 500 });
      }

      const creatorEmails = generalOrgUsers?.map(user => user.email) || [];
      if (!creatorEmails.includes(targetOrg.created_by_email)) {
        return NextResponse.json({ error: 'Access denied. You can only edit organizations created by your team.' }, { status: 403 });
      }
    }
    // For non-general organizations, no additional check needed since they can only edit their own org

    let updatedOrg = null;
    let updatedSettings = null;

    // Update organization if data provided
    if (orgData) {
      const { data: org, error: orgUpdateError } = await supabase
        .from('organizations')
        .update(orgData)
        .eq('id', orgId)
        .select()
        .single();

      if (orgUpdateError) {
        console.error('Error updating organization:', orgUpdateError);
        return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
      }

      updatedOrg = org;
    }

    // Update or create settings if data provided
    if (settingsData) {
      // Check if settings record exists
      const { data: existingSettings, error: existingError } = await supabase
        .from('settings')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing settings:', existingError);
        return NextResponse.json({ error: 'Error checking settings' }, { status: 500 });
      }

      if (existingSettings) {
        // Update existing settings
        const { data: settings, error: settingsUpdateError } = await supabase
          .from('settings')
          .update(settingsData)
          .eq('organization_id', orgId)
          .select()
          .single();

        if (settingsUpdateError) {
          console.error('Error updating settings:', settingsUpdateError);
          return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
        }

        updatedSettings = settings;
      } else {
        // Create new settings record
        const { data: settings, error: settingsCreateError } = await supabase
          .from('settings')
          .insert({
            organization_id: orgId,
            ...settingsData
          })
          .select()
          .single();

        if (settingsCreateError) {
          console.error('Error creating settings:', settingsCreateError);
          return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
        }

        updatedSettings = settings;
      }
    }

    return NextResponse.json({
      success: true,
      organization: updatedOrg,
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
