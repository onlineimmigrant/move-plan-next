import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const orgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
    
    console.log('Testing organization API endpoints for orgId:', orgId);

    // Fetch the target organization first
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return NextResponse.json({ error: 'Organization not found', details: orgError }, { status: 404 });
    }

    console.log('Organization found:', organization?.name);

    // Test cookie categories
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

    console.log('🍪 Cookie categories result:', cookie_categories?.length || 0, 'records');
    if (cookieCategoriesError) console.error('Cookie categories error:', cookieCategoriesError);

    // Test cookie services
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

    console.log('🍪 Cookie services result:', cookie_services?.length || 0, 'records');
    if (cookieServicesError) console.error('Cookie services error:', cookieServicesError);

    // Test cookie consent records
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
      .limit(5);

    console.log('🍪 Cookie consent result:', cookie_consent_records?.length || 0, 'records');
    if (cookieConsentError) console.error('Cookie consent error:', cookieConsentError);

    return NextResponse.json({
      success: true,
      organization: organization?.name || 'Unknown',
      organization_id: orgId,
      cookie_categories: cookie_categories || [],
      cookie_services: cookie_services || [],
      cookie_consent_records: cookie_consent_records || [],
      counts: {
        categories: cookie_categories?.length || 0,
        services: cookie_services?.length || 0,
        consent: cookie_consent_records?.length || 0
      },
      errors: {
        org: orgError,
        categories: cookieCategoriesError,
        services: cookieServicesError,
        consent: cookieConsentError
      }
    });

  } catch (error) {
    console.error('Test organization API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
