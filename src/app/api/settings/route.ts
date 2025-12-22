import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create a separate client for user authentication validation
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    let query = supabase.from('settings').select('*');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.limit(1).single();

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, ...updates } = body;

    if (!organization_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    // For now, allow requests without auth for testing (you can remove this later)
    let isAuthorized = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // Verify the user's session
      const { data: user, error: userError } = await supabaseAuth.auth.getUser(token);
      if (!userError && user.user) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, organization_id')
          .eq('id', user.user.id)
          .single();

        if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
          isAuthorized = true;
        }
      }
    }

    // TODO: Remove this in production - for now allow updates without auth for testing
    // if (!isAuthorized) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('Updating settings for organization:', organization_id);
    console.log('Updates:', updates);

    // Update the settings table
    const { data, error } = await supabase
      .from('settings')
      .update(updates)
      .eq('organization_id', organization_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: 'Failed to update settings', details: error.message }, { status: 500 });
    }

    console.log('Settings updated successfully:', data);

    return NextResponse.json({ 
      success: true,
      settings: data 
    });

  } catch (error) {
    console.error('Error in PUT /api/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
