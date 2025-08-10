// Debug endpoint to check cookie categories
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('🔍 Debug: Checking database structure and data...');

    // Test 1: cookie_category table structure and data
    const { data: categories, error: categoriesError } = await supabase
      .from('cookie_category')
      .select(`
        id,
        name,
        description,
        name_translation,
        description_translation
      `)
      .limit(5);

    console.log('🍪 Categories test:', { categories, categoriesError });

    // Test 2: cookie_service table structure and data
    const { data: services, error: servicesError } = await supabase
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
      .limit(5);

    console.log('🍪 Services test:', { services, servicesError });

    // Test 3: cookie_consent table structure and data
    const { data: consent, error: consentError } = await supabase
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
      .limit(5);

    console.log('🍪 Consent test:', { consent, consentError });

    // Test 4: user_organization table
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organization')
      .select('user_id, organization_id')
      .eq('organization_id', 'de0d5c21-787f-49c2-a665-7ff8e599c891')
      .limit(5);

    console.log('👥 User organizations test:', { userOrgs, userOrgsError });

    // Test 5: Organization-specific cookie services
    const { data: orgServices, error: orgServicesError } = await supabase
      .from('cookie_service')
      .select('*')
      .eq('organization_id', 'de0d5c21-787f-49c2-a665-7ff8e599c891');

    console.log('� Org-specific services test:', { orgServices, orgServicesError });

    return NextResponse.json({
      tests: {
        cookie_categories: {
          data: categories,
          error: categoriesError,
          count: categories?.length || 0
        },
        cookie_services: {
          data: services,
          error: servicesError,
          count: services?.length || 0
        },
        cookie_consent: {
          data: consent,
          error: consentError,
          count: consent?.length || 0
        },
        user_organization: {
          data: userOrgs,
          error: userOrgsError,
          count: userOrgs?.length || 0
        },
        org_specific_services: {
          data: orgServices,
          error: orgServicesError,
          count: orgServices?.length || 0
        }
      },
      summary: {
        categories_working: !categoriesError && categories?.length > 0,
        services_table_exists: !servicesError || servicesError.code !== '42P01',
        consent_table_exists: !consentError || consentError.code !== '42P01',
        user_org_table_exists: !userOrgsError || userOrgsError.code !== '42P01'
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Debug failed', details: error }, { status: 500 });
  }
}
