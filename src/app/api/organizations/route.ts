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

    if (currentOrg.type === 'general') {
      // GENERAL ORGANIZATION LOGIC (unchanged)
      // Only admins in general organizations can view all organizations they manage
      if (profile.role !== 'admin') {
        return NextResponse.json({ error: 'Access denied. Admin role required for general organization access.' }, { status: 403 });
      }

      // Get organizations created by users from this specific general organization
      const { data: generalOrgUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('organization_id', profile.organization_id)
        .or('role.eq.admin,is_site_creator.eq.true');

      console.log('General org users with creation rights:', { generalOrgUsers, usersError });

      if (usersError) {
        console.error('Error fetching general org users:', usersError);
        return NextResponse.json({ error: 'Error fetching organization users' }, { status: 500 });
      }

      const creatorEmails = generalOrgUsers?.map(user => user.email) || [];
      console.log('Creator emails to filter by:', creatorEmails);

      // Get organizations created by these users
      const { data: managedOrganizations, error: organizationsError } = await supabase
        .from('organizations')
        .select('id, name, type, base_url, base_url_local, created_at, created_by_email')
        .neq('type', 'general') // Exclude general organizations from the list
        .in('created_by_email', creatorEmails); // Only show organizations created by users from this general org

      console.log('Managed organizations query result:', { managedOrganizations, organizationsError });

      if (organizationsError) {
        console.error('Error fetching managed organizations:', organizationsError);
        return NextResponse.json({ error: 'Error fetching organizations' }, { status: 500 });
      }

      // Transform the data - all organizations shown will have admin access for general org admins
      organizations = managedOrganizations?.map(org => ({
        ...org,
        user_role: 'admin', // General org admins have admin access to all managed organizations
        user_status: 'active'
      })) || [];

      // Check if user can create more organizations
      canCreateMore = profile.is_site_creator === true;

    } else {
      // NON-GENERAL ORGANIZATION LOGIC (new)
      // Users in non-general organizations can access their own organization
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
      canCreateMore = false; // Non-general org users typically cannot create more organizations
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
