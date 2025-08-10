import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Minimal organization API for testing cookie management
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = id;

    console.log('🍪 Fetching cookie data for organization:', orgId);

    // Fetch the organization's cookie categories (global categories)
    const { data: cookie_categories, error: cookieCategoriesError } = await supabase
      .from('cookie_category')
      .select(`
        id,
        name,
        description,
        name_translation,
        description_translation
      `)
      .order('id', { ascending: true });

    console.log('🍪 Cookie categories:', cookie_categories);

    // Fetch the organization's cookie services (organization-specific)
    const { data: cookie_services, error: cookieServicesError } = await supabase
      .from('cookie_service')
      .select(`
        id,
        name,
        description,
        active,
        processing_company,
        data_processor_cookie_policy_url,
        data_processor_privacy_policy_url,
        data_protection_officer_contact,
        retention_period,
        category_id,
        organization_id
      `)
      .eq('organization_id', orgId)
      .order('id', { ascending: true });

    console.log('🍪 Cookie services:', cookie_services);

    // Fetch the organization's cookie consent records
    const { data: cookie_consent_records, error: cookieConsentError } = await supabase
      .from('cookie_consent')
      .select(`
        id,
        created_at,
        ip_address,
        consent_given,
        consent_data,
        user_id,
        last_updated,
        language_auto
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    console.log('🍪 Cookie consent records:', cookie_consent_records);

    // Return minimal organization data with cookie information
    return NextResponse.json({
      organization: { id: orgId, name: 'Test Organization' },
      cookie_categories: cookie_categories || [],
      cookie_services: cookie_services || [],
      cookie_consent_records: cookie_consent_records || [],
      // Include empty arrays for other expected fields to prevent errors
      settings: null,
      website_hero: null,
      menu_items: [],
      submenu_items: [],
      blog_posts: [],
      products: [],
      features: [],
      faqs: [],
      banners: []
    });

  } catch (error) {
    console.error('Error in minimal organization API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = id;
    const body = await request.json();

    console.log('🍪 PUT request for cookie data, organization:', orgId);
    console.log('🍪 Request body:', JSON.stringify(body, null, 2));

    // Handle cookie services updates
    if (body.cookie_services) {
      console.log('🍪 Updating cookie services...');
      
      // For now, just return success - proper implementation would update the database
      return NextResponse.json({
        success: true,
        message: 'Cookie services updated (placeholder response)',
        cookie_services: body.cookie_services
      });
    }

    return NextResponse.json({ success: true, message: 'Update received' });

  } catch (error) {
    console.error('Error in minimal organization PUT API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
