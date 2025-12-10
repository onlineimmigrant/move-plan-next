// app/api/team-members/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch team members from the current organization only
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, team, customer, organization_id')
      .eq('organization_id', organizationId)
      .eq('team->>is_team_member', 'true')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching team members:', error);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error('Error in team-members API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}