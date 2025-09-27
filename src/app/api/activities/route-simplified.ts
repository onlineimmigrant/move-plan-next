import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { organization_id, action, details, user_email } = body;

    // Validate required fields
    if (!organization_id || !action) {
      return NextResponse.json({ error: 'organization_id and action are required' }, { status: 400 });
    }

    // Insert activity record
    const { data: activity, error } = await supabase
      .from('organization_activities')
      .insert({
        organization_id,
        action,
        details,
        user_email: user_email || user.email
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting activity:', error);
      return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
    }

    return NextResponse.json({ activity });

  } catch (error) {
    console.error('Error in activity POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Fetching activities for user:', user.email);

    // Simplified query - just get all activities without complex joins
    const { data: activities, error } = await supabase
      .from('organization_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json({ error: 'Failed to fetch activities', details: error.message }, { status: 500 });
    }

    console.log('Activities fetched:', activities?.length || 0);

    // Transform the data without organization join
    const transformedActivities = activities?.map(activity => ({
      id: activity.id,
      organization_id: activity.organization_id,
      organization_name: `Organization ${activity.organization_id?.slice(0, 8)}...`, // Fallback name
      action: activity.action,
      details: activity.details,
      created_at: activity.created_at,
      user_email: activity.user_email
    })) || [];

    return NextResponse.json({
      activities: transformedActivities,
      total: transformedActivities.length
    });

  } catch (error) {
    console.error('Error in activity API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
