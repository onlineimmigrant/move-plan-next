import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test organization API without authentication for debugging
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = id;

    console.log('🔍 Testing organization API for:', orgId);

    // Test if organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single();

    if (orgError) {
      console.error('Organization not found:', orgError);
      return NextResponse.json({ 
        error: 'Organization not found', 
        details: orgError,
        orgId 
      }, { status: 404 });
    }

    console.log('🏢 Organization found:', organization?.name);

    // Test cookie categories fetch
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
    console.log('🍪 Cookie categories error:', cookieCategoriesError);

    // Test cookie services fetch
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
    console.log('🍪 Cookie services error:', cookieServicesError);

    // Test users for this organization
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('organization_id', orgId);

    console.log('👥 Org users result:', orgUsers?.length || 0, 'users');
    console.log('👥 Org users error:', orgUsersError);

    // Test cookie consent records
    let cookie_consent_records = null;
    let cookieConsentError = null;

    if (orgUsers && orgUsers.length > 0) {
      const userIds = orgUsers.map(u => u.id);
      console.log('🍪 Looking for consent records for user IDs:', userIds);
      
      const { data: consent_data, error: consent_error } = await supabase
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
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(10);

      cookie_consent_records = consent_data;
      cookieConsentError = consent_error;
    } else {
      // Get all consent records for testing
      const { data: consent_data, error: consent_error } = await supabase
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
        .limit(10);

      cookie_consent_records = consent_data;
      cookieConsentError = consent_error;
    }

    console.log('🍪 Cookie consent result:', cookie_consent_records?.length || 0, 'records');
    console.log('🍪 Cookie consent error:', cookieConsentError);

    return NextResponse.json({
      success: true,
      organization: organization,
      cookie_categories: cookie_categories || [],
      cookie_services: cookie_services || [],
      cookie_consent_records: cookie_consent_records || [],
      orgUsers: orgUsers || [],
      counts: {
        categories: cookie_categories?.length || 0,
        services: cookie_services?.length || 0,
        consent: cookie_consent_records?.length || 0,
        users: orgUsers?.length || 0
      },
      errors: {
        org: orgError,
        categories: cookieCategoriesError,
        services: cookieServicesError,
        consent: cookieConsentError,
        users: orgUsersError
      }
    });

  } catch (error) {
    console.error('Test organization API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}
