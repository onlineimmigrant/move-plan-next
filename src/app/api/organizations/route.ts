import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
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
    console.log('Fetching organizations for user:', userId);

    // Get user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator')
      .eq('id', userId)
      .single();

    console.log('Profile query result:', { profile, profileError });

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user's organization is 'general' type - only general org users can access site management
    if (!profile.organization_id) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const { data: currentOrg, error: currentOrgError } = await supabase
      .from('organizations')
      .select('id, name, type, base_url, base_url_local, created_at, created_by_email')
      .eq('id', profile.organization_id)
      .single();

    console.log('Current organization check:', { currentOrg, currentOrgError });

    if (currentOrgError || !currentOrg) {
      console.error('Error fetching current organization:', currentOrgError);
      return NextResponse.json({ error: 'Could not verify organization' }, { status: 500 });
    }

    console.log('User organization type:', currentOrg.type, 'User role:', profile.role);

    let organizations: any[] = [];
    let canCreateMore = false;

    if (currentOrg.type === 'platform') {
      // PLATFORM ORGANIZATION LOGIC
      // Only admins in platform organizations can view all organizations they manage
      if (profile.role !== 'admin' && profile.role !== 'superadmin') {
        return NextResponse.json({ error: 'Access denied. Admin role required for platform organization access.' }, { status: 403 });
      }

      // Get organizations created by users from this specific general organization
      const { data: generalOrgUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('organization_id', profile.organization_id)
        .or('role.eq.admin,is_site_creator.eq.true');

      console.log('Platform org users with creation rights:', { generalOrgUsers, usersError });

      if (usersError) {
        console.error('Error fetching platform org users:', usersError);
        return NextResponse.json({ error: 'Error fetching organization users' }, { status: 500 });
      }

      const creatorEmails = generalOrgUsers?.map(user => user.email) || [];
      console.log('Creator emails to filter by:', creatorEmails);

      // Get both the platform organization itself AND child organizations created by platform users
      const queries = [];
      
      // 1. Get the platform organization itself
      queries.push(
        supabase
          .from('organizations')
          .select('id, name, type, base_url, base_url_local, created_at, created_by_email')
          .eq('id', profile.organization_id)
      );
      
      // 2. Get child organizations created by platform users
      if (creatorEmails.length > 0) {
        queries.push(
          supabase
            .from('organizations')
            .select('id, name, type, base_url, base_url_local, created_at, created_by_email')
            .not('type', 'in', '(platform,general)') // Exclude other platform and general organizations
            .in('created_by_email', creatorEmails)
        );
      }
      
      const results = await Promise.all(queries);
      const platformOrgResult = results[0];
      const childOrgsResult = results[1];
      
      if (platformOrgResult.error) {
        console.error('Error fetching platform organization:', platformOrgResult.error);
        return NextResponse.json({ error: 'Error fetching platform organization' }, { status: 500 });
      }
      
      let allOrganizations = platformOrgResult.data || [];
      
      if (childOrgsResult && !childOrgsResult.error) {
        allOrganizations = [...allOrganizations, ...(childOrgsResult.data || [])];
      } else if (childOrgsResult?.error) {
        console.error('Error fetching child organizations:', childOrgsResult.error);
      }
      
      const managedOrganizations = allOrganizations;

      console.log('Managed organizations query result:', { managedOrganizations });

      // Transform the data - platform org shows actual role, child orgs show admin access
      organizations = managedOrganizations?.map(org => ({
        ...org,
        user_role: org.id === profile.organization_id ? profile.role : 'admin', // Platform org shows actual role, child orgs show admin
        user_status: 'active'
      })) || [];

      // Check if user can create more organizations
      canCreateMore = profile.is_site_creator === true;

    } else {
      // NON-PLATFORM ORGANIZATION LOGIC (new)
      // Users in non-platform organizations can access their own organization
      // and any sites created by their organization's creator email
      console.log('Processing non-general organization access');

      // Get the current user's organization (their own site)
      const currentOrgData = {
        id: currentOrg.id,
        name: currentOrg.name,
        type: currentOrg.type,
        base_url: currentOrg.base_url,
        base_url_local: currentOrg.base_url_local,
        created_at: currentOrg.created_at,
        created_by_email: currentOrg.created_by_email || '',
        user_role: profile.role || 'member', // Use their actual role in this organization
        user_status: 'active'
      };

      organizations = [currentOrgData];

      // Check if they can create more (only if they have site creation permissions and are in their original org)
      canCreateMore = false; // Non-platform org users typically cannot create more organizations
    }

    return NextResponse.json({
      organizations: organizations,
      canCreateMore,
      profile: {
        role: profile.role,
        is_site_creator: profile.is_site_creator,
        current_organization_id: profile.organization_id
      }
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
