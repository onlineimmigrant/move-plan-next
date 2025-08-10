import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServerClient';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organization_id = url.searchParams.get('organization_id');
    
    // Validate that organization_id is provided
    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id query parameter is required' }, { status: 400 });
    }

    // Log the cookies to debug if they're being sent
    const cookieStore = await cookies();
   // console.log('Request cookies in GET /api/cookies/consent:', await cookieStore.getAll());

    // Get the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.replace('Bearer ', '');
      // Use the access token to authenticate the user
      const { data: { user }, error: userError } = await supabaseServer.auth.getUser(accessToken);
      if (userError) {
        console.error('Supabase auth error with token:', userError);
      } else {
        userId = user?.id || null;
        console.log('Authenticated user ID:', userId);
      }
    } else {
      console.log('No Authorization header found, treating as anonymous user');
      // Fallback to cookie-based authentication (if needed)
      try {
        const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
        if (userError) {
          console.error('Supabase auth error with cookies:', userError);
        } else {
          userId = user?.id || null;
          console.log('Authenticated user ID (cookies):', userId);
        }
      } catch (authError) {
        console.error('Error retrieving user session:', authError);
        userId = null;
      }
    }

    // Fetch the latest consent record for the user (authenticated or anonymous) within the organization
    let consentQuery = supabaseServer
      .from('cookie_consent')
      .select('id')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (userId === null) {
      consentQuery = consentQuery.is('user_id', null);
    } else {
      consentQuery = consentQuery.eq('user_id', userId);
    }

    const { data: consentData, error: consentError } = await consentQuery;

    if (consentError) {
      console.error('Supabase error (consent):', consentError);
      return NextResponse.json({ services: [] });
    }

    if (!consentData || consentData.length === 0) {
      return NextResponse.json({ services: [] });
    }

    // Fetch associated services
    const { data: servicesData, error: servicesError } = await supabaseServer
      .from('cookie_consent_services')
      .select('cookie_service_id')
      .eq('cookie_consent_id', consentData[0].id);

    if (servicesError) {
      console.error('Supabase error (services):', servicesError);
      return NextResponse.json({ services: [] });
    }

    const services = servicesData ? servicesData.map((item) => item.cookie_service_id) : [];
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching consent:', error);
    return NextResponse.json({ services: [] });
  }
}

export async function POST(request: Request) {
  const { consent_given, services, organization_id } = await request.json();

  // Validate that organization_id is provided
  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
  }

  try {
    // Log the cookies to debug if they're being sent
    const cookieStore = await cookies();
  //  console.log('Request cookies in POST /api/cookies/consent:', await cookieStore.getAll());

    // Get the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.replace('Bearer ', '');
      // Use the access token to authenticate the user
      const { data: { user }, error: userError } = await supabaseServer.auth.getUser(accessToken);
      if (userError) {
        console.error('Supabase auth error with token:', userError);
      } else {
        userId = user?.id || null;
        console.log('Authenticated user ID:', userId);
      }
    } else {
      console.log('No Authorization header found, treating as anonymous user');
      // Fallback to cookie-based authentication (if needed)
      try {
        const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
        if (userError) {
          console.error('Supabase auth error with cookies:', userError);
        } else {
          userId = user?.id || null;
          console.log('Authenticated user ID (cookies):', userId);
        }
      } catch (authError) {
        console.error('Error retrieving user session:', authError);
        userId = null;
      }
    }

    // Insert into cookie_consent with the correct user_id and organization_id
    const { data: consentData, error: consentError } = await supabaseServer
      .from('cookie_consent')
      .insert({ 
        consent_given, 
        user_id: userId,
        organization_id: organization_id 
      })
      .select('id')
      .single();

    if (consentError) {
      console.error('Supabase error (insert consent):', consentError);
      return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 });
    }

    if (!consentData) {
      return NextResponse.json({ error: 'Failed to create consent record' }, { status: 500 });
    }

    // Insert service associations into cookie_consent_services
    if (Array.isArray(services) && services.length > 0) {
      const serviceEntries = services.map((serviceId) => ({
        cookie_consent_id: consentData.id,
        cookie_service_id: serviceId,
      }));
      const { error: servicesError } = await supabaseServer
        .from('cookie_consent_services')
        .insert(serviceEntries);

      if (servicesError) {
        console.error('Supabase error (insert services):', servicesError);
        return NextResponse.json({ error: 'Failed to save services' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving consent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}