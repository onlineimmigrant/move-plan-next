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
      .select('type')
      .eq('id', profile.organization_id)
      .single();

    console.log('Current organization check:', { currentOrg, currentOrgError });

    if (currentOrgError || !currentOrg) {
      console.error('Error fetching current organization:', currentOrgError);
      return NextResponse.json({ error: 'Could not verify organization' }, { status: 500 });
    }

    // Only users in 'general' organizations can access site management
    if (currentOrg.type !== 'general') {
      return NextResponse.json({ error: 'Access denied. Only general organization members can access site management.' }, { status: 403 });
    }

    // Only admins in general organizations can view all organizations
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Get organizations created by users from this specific general organization
    // First, get all users from this general organization who have created organizations
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
    const { data: organizations, error: organizationsError } = await supabase
      .from('organizations')
      .select('id, name, type, base_url, base_url_local, created_at, created_by_email')
      .neq('type', 'general') // Exclude general organizations from the list
      .in('created_by_email', creatorEmails); // Only show organizations created by users from this general org

    console.log('Organizations query result:', { organizations, organizationsError });

    if (organizationsError) {
      console.error('Error fetching organizations:', organizationsError);
      return NextResponse.json({ error: 'Error fetching organizations' }, { status: 500 });
    }

    // Transform the data - all organizations shown will have admin access for general org admins
    const transformedOrganizations = organizations?.map(org => ({
      ...org,
      user_role: 'admin', // General org admins have admin access to all created organizations
      user_status: 'active'
    })) || [];

    // Check if user can create more organizations
    // Only users with is_site_creator = true in general organizations can create organizations
    const canCreateMore = profile.is_site_creator === true;

    return NextResponse.json({
      organizations: transformedOrganizations,
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
