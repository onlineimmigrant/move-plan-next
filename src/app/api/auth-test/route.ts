import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Auth test endpoint called');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);

    // Verify the user's session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    console.log('User verification result:', { 
      userId: user?.user?.id, 
      email: user?.user?.email, 
      error: userError?.message 
    });
    
    if (userError || !user.user) {
      return NextResponse.json({ error: 'Invalid token', details: userError?.message }, { status: 401 });
    }

    // Test profile query
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator')
      .eq('id', user.user.id)
      .single();

    console.log('Profile query result:', { profile, profileError });

    return NextResponse.json({
      success: true,
      user: {
        id: user.user.id,
        email: user.user.email
      },
      profile,
      profileError: profileError?.message
    });

  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
