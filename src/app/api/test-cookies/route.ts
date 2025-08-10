import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const orgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';

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

    console.log('🍪 Test cookie categories:', cookie_categories);
    console.log('🍪 Test cookie categories error:', cookieCategoriesError);

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

    console.log('🍪 Test cookie services:', cookie_services);
    console.log('🍪 Test cookie services error:', cookieServicesError);

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

    console.log('🍪 Test cookie consent records:', cookie_consent_records);
    console.log('🍪 Test cookie consent error:', cookieConsentError);

    return NextResponse.json({
      success: true,
      cookie_categories: cookie_categories || [],
      cookie_services: cookie_services || [],
      cookie_consent_records: cookie_consent_records || [],
      errors: {
        categories: cookieCategoriesError,
        services: cookieServicesError,
        consent: cookieConsentError
      }
    });

  } catch (error) {
    console.error('Test cookies error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
