/**
 * API Route: Update Account Profile
 * POST /api/accounts/update
 * 
 * Updates profile data including customer and team JSONB fields
 * Used for updating lead status, testimonial status, and other profile data
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check for Authorization header first (for API calls from client components)
    const authHeader = request.headers.get('Authorization');
    let supabase;
    
    if (authHeader) {
      // Use token-based auth
      const token = authHeader.replace('Bearer ', '');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
    } else {
      // Fall back to cookie-based auth
      const cookieStore = await cookies();
      supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    }

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile to check organization
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile?.organization_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { profileId, customer, team } = body;

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Verify profile belongs to same organization
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', profileId)
      .single();

    if (targetProfile?.organization_id !== userProfile.organization_id) {
      return NextResponse.json(
        { error: 'Profile not found or access denied' },
        { status: 403 }
      );
    }

    // Build update object
    const updates: any = {};
    if (customer !== undefined) {
      updates.customer = customer;
    }
    if (team !== undefined) {
      updates.team = team;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error('Error in update account route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
