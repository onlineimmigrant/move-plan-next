// app/api/profiles/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';

interface Profile {
  id: string;
  uuid: string;
  username: string;
  full_name: string | null;
  created_at: string;
  email: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  role: string | null;
  updated_at: string;
  organization_id: string | null; // Add organization_id
}

// GET: Fetch the user's profile
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

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Profile not found for this organization' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update the user's profile
export async function PATCH(request: Request) {
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

    // Verify the profile exists for the organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found for this organization' }, { status: 404 });
    }

    const body = await request.json();
    const { field, value } = body;

    const allowedFields = [
      'username',
      'full_name',
      'email',
      'city',
      'postal_code',
      'country',
      'role',
    ];
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}