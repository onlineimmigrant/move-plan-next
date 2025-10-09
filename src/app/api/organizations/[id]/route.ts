import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';
import { logActivity, getOrganizationName } from '@/lib/activityLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function for robust boolean conversion
function convertToBoolean(value: any): boolean {
  console.log('🔍 convertToBoolean called with:');
  console.log('  - value:', JSON.stringify(value));
  console.log('  - type:', typeof value);
  console.log('  - constructor:', value?.constructor?.name);
  console.log('  - toString():', String(value));
  
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === '') {
    console.log('✅ convertToBoolean returning false for null/undefined/empty');
    return false;
  }
  
  // Handle boolean values
  if (typeof value === 'boolean') {
    console.log('✅ convertToBoolean returning boolean:', value);
    return value;
  }
  
  // Handle numbers
  if (typeof value === 'number') {
    const result = value > 0;
    console.log('✅ convertToBoolean returning for number:', result, 'from', value);
    return result;
  }
  
  // Handle strings
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();
    console.log('🔍 convertToBoolean processing string:', lowerValue);
    
    // Handle explicit boolean strings
    if (lowerValue === 'true') {
      console.log('✅ convertToBoolean returning true for "true"');
      return true;
    }
    if (lowerValue === 'false') {
      console.log('✅ convertToBoolean returning false for "false"');
      return false;
    }
    
    // Handle numeric strings (including "2")
    if (!isNaN(Number(lowerValue))) {
      const numValue = Number(lowerValue);
      const result = numValue > 0;
      console.log('✅ convertToBoolean returning for numeric string:', result, 'from numeric value:', numValue, 'original string:', lowerValue);
      return result;
    }
    
    // Handle any other string cases
    console.log('⚠️ convertToBoolean processing non-numeric string:', lowerValue);
  }
  
  // Handle objects or arrays (just in case)
  if (typeof value === 'object') {
    console.log('⚠️ convertToBoolean received object:', JSON.stringify(value));
    return false;
  }
  
  // Default fallback
  console.log('⚠️ convertToBoolean returning false as fallback for:', typeof value, value);
  return false;
}

// GET - Fetch organization details with settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties
    const { id } = await params;
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Check if this is a service role key (for testing/development)
    const isServiceRole = token === process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let userId = null;
    
    if (!isServiceRole) {
      // Verify the user's session for normal user tokens
      const { data: user, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user.user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      userId = user.user.id;
    } else {
      // For service role, skip user verification and proceed with admin access
      console.log('🔑 Service role detected - bypassing user auth for development');
    }
    const orgId = id;

    console.log('Fetching organization details for:', orgId, 'by user:', userId || 'service-role');

    // Skip permission checks for service role (development/testing)
    if (!isServiceRole) {
      // Get user's profile to check permissions
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, organization_id, is_site_creator')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      // Check if user's organization is 'general' type
      if (!profile.organization_id) {
        return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
      }

      const { data: currentOrg, error: currentOrgError } = await supabase
        .from('organizations')
        .select('type')
        .eq('id', profile.organization_id)
        .single();

      if (currentOrgError || !currentOrg) {
        return NextResponse.json({ error: 'Could not verify organization' }, { status: 500 });
      }

      console.log('User organization type:', currentOrg.type, 'Requested org ID:', orgId, 'User org ID:', profile.organization_id);

      // Permission validation logic for regular users
      if (currentOrg.type === 'platform' || currentOrg.type === 'general') {
        // PLATFORM/GENERAL ORGANIZATION LOGIC
        if (profile.role !== 'admin') {
          return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
        }

        // Platform organization admins can access:
        // 1. Their own platform organization 
        // 2. Any child organization created by platform organization users
        
        // If requesting their own platform organization, allow access
        if (orgId === profile.organization_id) {
          console.log('✅ Platform admin accessing their own organization');
          // Continue with the request - access granted
        } else {
          // Check if the requested organization was created by someone from the platform organization
          const { data: platformOrgUsers, error: usersError } = await supabase
            .from('profiles')
            .select('email')
            .eq('organization_id', profile.organization_id)
            .or('role.eq.admin,is_site_creator.eq.true');

          if (usersError) {
            return NextResponse.json({ error: 'Error verifying permissions' }, { status: 500 });
          }

          const creatorEmails = platformOrgUsers?.map((user: any) => user.email) || [];
          
          // Check if the requested organization was created by a platform user
          const { data: targetOrg, error: targetOrgError } = await supabase
            .from('organizations')
            .select('created_by_email')
            .eq('id', orgId)
            .single();
            
          if (targetOrgError || !targetOrg) {
            return NextResponse.json({ error: 'Target organization not found' }, { status: 404 });
          }
          
          if (!creatorEmails.includes(targetOrg.created_by_email)) {
            return NextResponse.json({ error: 'Access denied. You can only access organizations created by your platform.' }, { status: 403 });
          }
          
          console.log('✅ Platform admin accessing child organization created by platform user');
        }
      } else {
        // CHILD ORGANIZATION LOGIC
        if (orgId !== profile.organization_id) {
          return NextResponse.json({ error: 'Access denied. You can only access your own organization.' }, { status: 403 });
        }

        if (profile.role !== 'admin' && profile.role !== 'member') {
          return NextResponse.json({ error: 'Access denied. Insufficient permissions.' }, { status: 403 });
        }
      }
    } else {
      console.log('🔑 Skipping permission checks for service role');
    }

    // Fetch the target organization first
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch the organization's settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 });
    }

    // Fetch the organization's hero data
    const { data: website_hero, error: heroError } = await supabase
      .from('website_hero')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (heroError && heroError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching hero data:', heroError);
      return NextResponse.json({ error: 'Error fetching hero data' }, { status: 500 });
    }

    // Fetch the organization's menu items
    const { data: menu_items, error: menuError } = await supabase
      .from('website_menuitem')
      .select(`
        id,
        display_name,
        display_name_translation,
        url_name,
        is_displayed,
        is_displayed_on_footer,
        order,
        react_icon_id,
        organization_id,
        description_translation
      `)
      .eq('organization_id', orgId)
      .order('order', { ascending: true });

    if (menuError) {
      console.error('Error fetching menu items:', menuError);
      return NextResponse.json({ error: 'Error fetching menu items' }, { status: 500 });
    }

    // Fetch the organization's submenu items
    const { data: submenu_items, error: submenuError } = await supabase
      .from('website_submenuitem')
      .select(`
        id,
        menu_item_id,
        name,
        name_translation,
        url_name,
        order,
        description,
        description_translation,
        is_displayed,
        image,
        organization_id
      `)
      .eq('organization_id', orgId)
      .order('order', { ascending: true });

    if (submenuError) {
      console.error('Error fetching submenu items:', submenuError);
      return NextResponse.json({ error: 'Error fetching submenu items' }, { status: 500 });
    }

    // Fetch the organization's blog posts
    const { data: blog_posts, error: blogPostsError } = await supabase
      .from('blog_post')
      .select(`
        id,
        title,
        slug,
        description,
        content,
        order,
        display_this_post,
        display_as_blog_post,
        organization_id,
        created_on,
        last_modified
      `)
      .eq('organization_id', orgId)
      .order('order', { ascending: true });

    if (blogPostsError) {
      console.error('Error fetching blog posts:', blogPostsError);
      return NextResponse.json({ error: 'Error fetching blog posts' }, { status: 500 });
    }

    // Fetch the organization's products
    const { data: products, error: productsError } = await supabase
      .from('product')
      .select(`
        id,
        product_name,
        slug,
        product_description,
        links_to_image,
        order,
        is_displayed,
        price_manual,
        currency_manual_symbol,
        product_tax_code,
        product_sub_type_id,
        organization_id,
        created_at,
        updated_at,
        stripe_product_id,
        attrs
      `)
      .eq('organization_id', orgId)
      .order('order', { ascending: true });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Error fetching products' }, { status: 500 });
    }

    // Fetch the organization's features
    const { data: features, error: featuresError } = await supabase
      .from('feature')
      .select(`
        id,
        name,
        slug,
        content,
        feature_image,
        display_content,
        display_on_product_card,
        type,
        package,
        organization_id,
        created_at
      `)
      .eq('organization_id', orgId)
      .order('id', { ascending: true });

    if (featuresError) {
      console.error('Error fetching features:', featuresError);
      return NextResponse.json({ error: 'Error fetching features' }, { status: 500 });
    }

    // Fetch the organization's FAQs
    const { data: faqs, error: faqsError } = await supabase
      .from('faq')
      .select(`
        id,
        question,
        answer,
        section,
        order,
        display_order,
        display_home_page,
        is_help_center,
        help_center_order,
        product_sub_type_id,
        organization_id,
        created_at
      `)
      .eq('organization_id', orgId)
      .order('order', { ascending: true });

    if (faqsError) {
      console.error('Error fetching FAQs:', faqsError);
      return NextResponse.json({ error: 'Error fetching FAQs' }, { status: 500 });
    }

    // Fetch the organization's banners
    const { data: banners, error: bannersError } = await supabase
      .from('banners')
      .select(`
        id,
        position,
        type,
        is_active,
        content,
        landing_content,
        open_state,
        dismissal_duration,
        page_paths,
        is_fixed_above_navbar,
        organization_id,
        end_date_promotion,
        end_date_promotion_is_displayed,
        start_at,
        end_at,
        priority,
        target_audience
      `)
      .eq('organization_id', orgId)
      .order('priority', { ascending: true });

    if (bannersError) {
      console.error('Error fetching banners:', bannersError);
      return NextResponse.json({ error: 'Error fetching banners' }, { status: 500 });
    }

    // Fetch the organization's cookie categories (global categories, no organization_id filter)
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

    console.log('🍪 Fetched cookie categories:', cookie_categories);
    console.log('🍪 Cookie categories error:', cookieCategoriesError);

    if (cookieCategoriesError) {
      console.error('Error fetching cookie categories:', cookieCategoriesError);
      return NextResponse.json({ error: 'Error fetching cookie categories' }, { status: 500 });
    }

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

    console.log('🍪 Fetched cookie services:', cookie_services);
    console.log('🍪 Cookie services error:', cookieServicesError);

    if (cookieServicesError) {
      console.error('Error fetching cookie services:', cookieServicesError);
      return NextResponse.json({ error: 'Error fetching cookie services' }, { status: 500 });
    }

    // Fetch the organization's cookie consent records (user consent history)
    // Now using organization_id directly instead of going through profiles table
    console.log('🍪 Fetching consent records directly for organization:', orgId);
    
    const { data: cookie_consent_records, error: cookieConsentError } = await supabase
      .from('cookie_consent')
      .select(`
        id,
        created_at,
        ip_address,
        consent_given,
        consent_data,
        user_id,
        organization_id,
        last_updated,
        language_auto
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100); // Limit to avoid huge datasets

    console.log('🍪 Fetched cookie consent records:', cookie_consent_records);
    console.log('🍪 Cookie consent records error:', cookieConsentError);

    if (cookieConsentError) {
      console.error('Error fetching cookie consent records:', cookieConsentError);
      // Don't fail completely if consent records can't be fetched, just log and continue
      console.log('Continuing without consent records due to error');
    }

    // Structure menu items with nested submenu items and map field names for admin interface
    let structuredMenuItems = menu_items;
    let mappedSubmenuItems = submenu_items;
    let mappedBanners = banners;
    
    if (menu_items && submenu_items && Array.isArray(menu_items) && Array.isArray(submenu_items)) {
      // Map submenu field names for admin interface compatibility
      mappedSubmenuItems = submenu_items.map((submenu: any) => ({
        ...submenu,
        website_menuitem_id: submenu.menu_item_id, // Map for admin interface
        url: submenu.url_name, // Map for admin interface
        is_visible: true, // Default since field doesn't exist in database
        is_new_window: false // Default since field doesn't exist in database
      }));
      
      // Structure menu items with nested submenu items
      structuredMenuItems = menu_items.map((menuItem: any) => ({
        ...menuItem,
        submenu_items: mappedSubmenuItems.filter((submenu: any) => submenu.menu_item_id === menuItem.id)
      }));
    }

    // Map banner field names for admin interface compatibility
    if (banners && Array.isArray(banners)) {
      mappedBanners = banners.map((banner: any) => ({
        ...banner,
        is_enabled: banner.is_active, // Map database is_active to frontend is_enabled
        openState: banner.open_state, // Map database open_state to frontend openState
        isFixedAboveNavbar: Boolean(banner.is_fixed_above_navbar), // Map database field to frontend field
        isOpen: false, // Default for admin interface
        isDismissed: false // Default for admin interface
      }));
    }

    console.log('🍪 Returning cookie_categories in response:', cookie_categories || []);
    console.log('🍪 Returning cookie_services in response:', cookie_services || []);
    console.log('🍪 Returning cookie_consent_records in response:', cookie_consent_records || []);

    return NextResponse.json({
      organization,
      settings: settings || null,
      website_hero: website_hero || null,
      menu_items: structuredMenuItems || [],
      submenu_items: mappedSubmenuItems || [],
      blog_posts: blog_posts || [],
      products: products || [],
      features: features || [],
      faqs: faqs || [],
      banners: mappedBanners || [],
      cookie_categories: cookie_categories || [],
      cookie_services: cookie_services || [],
      cookie_consent_records: cookie_consent_records || []
    });

  } catch (error) {
    console.error('Error fetching organization details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update organization and settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('PUT /api/organizations/[id] - Starting request');
  
  try {
    // Await params before accessing properties
    const { id } = await params;
    console.log('PUT - Organization ID:', id);
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('PUT - No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user.user) {
      console.log('PUT - Invalid token:', userError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;
    const orgId = id;
    const body = await request.json();

    // 🚨 DEBUG: Log the entire request body to see what's being sent
    console.log('🔍 FULL REQUEST BODY:', JSON.stringify(body, null, 2));
    
    // 🚨 DEBUG: Check ALL boolean fields across ALL content types
    const booleanFields = ['display_home_page', 'display_this_post', 'display_as_blog_post', 'is_displayed', 'display_content', 'display_on_product_card', 'is_displayed_on_footer'];
    
    Object.keys(body).forEach(key => {
      const data = body[key];
      if (Array.isArray(data)) {
        console.log(`🔍 Checking ${key} array for boolean fields:`);
        data.forEach((item: any, index: number) => {
          if (typeof item === 'object' && item !== null) {
            booleanFields.forEach(field => {
              if (field in item) {
                console.log(`  ${key}[${index}].${field}:`, {
                  value: item[field],
                  type: typeof item[field],
                  constructor: item[field]?.constructor?.name,
                  toString: String(item[field]),
                  isStringTwo: item[field] === '2'
                });
              }
            });
          }
        });
      }
    });

    // 🚨 DEBUG: Check settings data for any field confusion  
    if (body.settings) {
      console.log('🔍 SETTINGS DATA ANALYSIS:');
      Object.keys(body.settings).forEach(key => {
        const value = body.settings[key];
        if (value === '2' || value === 2) {
          console.log(`  ⚠️ FOUND "2" VALUE in settings.${key}:`, {
            value: value,
            type: typeof value,
            constructor: value?.constructor?.name
          });
        }
      });
    }

    // 🚨 DEBUG: Check website_hero data for any field confusion
    if (body.website_hero) {
      console.log('🔍 WEBSITE_HERO DATA ANALYSIS:');
      Object.keys(body.website_hero).forEach(key => {
        const value = body.website_hero[key];
        if (value === '2' || value === 2) {
          console.log(`  ⚠️ FOUND "2" VALUE in website_hero.${key}:`, {
            value: value,
            type: typeof value,
            constructor: value?.constructor?.name
          });
        }
      });
    }

    console.log('PUT - Updating organization:', orgId, 'with data keys:', Object.keys(body));
    console.log('PUT - User ID:', userId);
    
    console.log('🔍 BODY KEYS:', Object.keys(body));
    console.log('🔍 HAS FAQS:', !!body.faqs);
    console.log('🔍 HAS FEATURES:', !!body.features);
    console.log('🔍 HAS BANNERS:', !!body.banners);

    const { organization: orgData, settings: settingsData, website_hero: heroData, menu_items: menuItems, submenu_items: submenuItems, blog_posts: blogPosts, products, features, faqs, banners, cookie_categories, cookie_services, cookie_consent_records } = body;

    // Debug: Log incoming FAQ data
    if (faqs) {
      console.log('📥 INCOMING FAQ DATA:', {
        count: Array.isArray(faqs) ? faqs.length : 'not array',
        faqs: JSON.stringify(faqs, null, 2)
      });
      
      // Check each FAQ for the "2" value in any field
      if (Array.isArray(faqs)) {
        faqs.forEach((faq, index) => {
          console.log(`📋 FAQ ${index}:`, JSON.stringify(faq, null, 2));
          Object.keys(faq).forEach(key => {
            if (faq[key] === 2 || faq[key] === '2') {
              console.log(`⚠️ FOUND "2" VALUE in FAQ ${index}, field "${key}":`, {
                value: faq[key],
                type: typeof faq[key]
              });
            }
          });
        });
      }
    }

    // Get user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator')
      .eq('id', userId)
      .single();

    console.log('PUT - Profile fetch result:', { profile, profileError });

    if (profileError || !profile) {
      console.log('PUT - Profile not found:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check permissions (same as GET)
    if (!profile.organization_id) {
      console.log('PUT - User has no organization_id');
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const { data: currentOrg, error: currentOrgError } = await supabase
      .from('organizations')
      .select('type')
      .eq('id', profile.organization_id)
      .single();

    console.log('PUT - Current org fetch result:', { currentOrg, currentOrgError });

    if (currentOrgError || !currentOrg) {
      console.log('PUT - Current organization not found:', currentOrgError);
      return NextResponse.json({ error: 'Current organization not found' }, { status: 404 });
    }

    console.log('PUT - Access control check:', {
      currentOrgType: currentOrg.type,
      userRole: profile.role,
      userOrgId: profile.organization_id,
      targetOrgId: orgId
    });

    // Access control based on organization type
    if (currentOrg.type === 'platform' || currentOrg.type === 'general') {
      // Platform/General organizations: check admin role and permissions
      console.log('PUT - Platform/General org access control');
      if (profile.role !== 'admin') {
        console.log('PUT - Access denied: not admin');
        return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
      }
      
      // Platform admins can edit their own org or child organizations created by platform users
      if (profile.organization_id !== orgId) {
        // Check if the target organization was created by someone from the platform organization
        const { data: platformOrgUsers, error: usersError } = await supabase
          .from('profiles')
          .select('email')
          .eq('organization_id', profile.organization_id)
          .or('role.eq.admin,is_site_creator.eq.true');

        if (usersError) {
          return NextResponse.json({ error: 'Error verifying permissions' }, { status: 500 });
        }

        const creatorEmails = platformOrgUsers?.map((user: any) => user.email) || [];
        
        // We'll check the creator email later in the additional permission check
      }
    } else {
      // Child organizations: check if editing their own organization
      console.log('PUT - Child org access control');
      if (profile.organization_id !== orgId) {
        console.log('PUT - Access denied: not own organization');
        return NextResponse.json({ error: 'Access denied. You can only edit your own organization.' }, { status: 403 });
      }
      // For child orgs, any member can edit their own org
    }

    // Verify user can edit this organization
    const { data: targetOrg, error: targetOrgError } = await supabase
      .from('organizations')
      .select('created_by_email')
      .eq('id', orgId)
      .single();

    if (targetOrgError) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Additional permission check only for platform/general organizations
    if (currentOrg.type === 'platform' || currentOrg.type === 'general') {
      const { data: platformOrgUsers, error: usersError } = await supabase
        .from('profiles')
        .select('email')
        .eq('organization_id', profile.organization_id)
        .or('role.eq.admin,is_site_creator.eq.true');

      if (usersError) {
        return NextResponse.json({ error: 'Error verifying permissions' }, { status: 500 });
      }

      const creatorEmails = platformOrgUsers?.map((user: any) => user.email) || [];
      if (!creatorEmails.includes(targetOrg.created_by_email)) {
        return NextResponse.json({ error: 'Access denied. You can only edit organizations created by your team.' }, { status: 403 });
      }
    }
    // For non-platform organizations, no additional check needed since they can only edit their own org

    let updatedOrg = null;
    let updatedSettings = null;
    let updatedHero = null;
    let updatedMenuItems = null;
    let updatedSubmenuItems = null;
    let updatedBlogPosts = null;
    let updatedProducts = null;
    let updatedFeatures = null;
    let updatedFaqs: any[] = [];
    let updatedBanners = null;
    let updatedCookieServices = null;
    let updatedCookieConsentRecords = null;

    // Update organization if data provided
    if (orgData) {
      const { data: org, error: orgUpdateError } = await supabase
        .from('organizations')
        .update(orgData)
        .eq('id', orgId)
        .select()
        .single();

      if (orgUpdateError) {
        console.error('Error updating organization:', orgUpdateError);
        return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
      }

      // Log the update activity
      if (org) {
        const organizationName = await getOrganizationName(orgId);
        await logActivity({
          organizationId: orgId,
          action: 'updated',
          details: `${organizationName} updated`,
          userEmail: user.user.email
        });
      }

      updatedOrg = org;
    }

    // Update or create settings if data provided
    if (settingsData) {
      console.log('[API] settingsData received:', {
        hasFeatures: !!settingsData.features,
        featuresCount: Array.isArray(settingsData.features) ? settingsData.features.length : 0,
        hasFaqs: !!settingsData.faqs,
        faqsCount: Array.isArray(settingsData.faqs) ? settingsData.faqs.length : 0,
        hasBanners: !!settingsData.banners,
        bannersCount: Array.isArray(settingsData.banners) ? settingsData.banners.length : 0,
      });
      
      // Filter out fields that don't belong in the settings table
      const { 
        products, 
        blog_posts, 
        menu_items, 
        submenu_items, 
        banners, // Add banners to filtered fields
        features, // Add features to filtered fields
        faqs, // Add faqs to filtered fields
        cookie_services, // Add cookie services to filtered fields
        cookie_consent_records, // Add cookie consent records to filtered fields
        ai_agents, // Add ai_agents to filtered fields - they're stored in ai_models_default table
        name, 
        base_url, 
        base_url_local, 
        type,
        hero_image,
        hero_name,
        hero_font_family,
        h1_title,
        h1_title_translation,
        is_seo_title,
        p_description,
        p_description_translation,
        h1_text_color,
        h1_text_color_gradient_from,
        h1_text_color_gradient_to,
        h1_size,
        h1_size_mobile,
        h1_weight,
        h1_alignment,
        p_description_size,
        p_description_size_mobile,
        p_description_weight,
        p_description_color,
        button_main_get_started,
        button_main_get_started_translation,
        button_main_url,
        button_secondary_text,
        button_secondary_text_translation,
        button_secondary_url,
        buttons_alignment,
        background_video,
        background_animation,
        block_width,
        columns,
        ...cleanSettingsData 
      } = settingsData;

      console.log('[API] Extracted arrays:', {
        features: features ? `${features.length} items` : 'undefined',
        faqs: faqs ? `${faqs.length} items` : 'undefined', 
        banners: banners ? `${banners.length} items` : 'undefined',
      });

      // Check if settings record exists
      const { data: existingSettings, error: existingError } = await supabase
        .from('settings')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing settings:', existingError);
        return NextResponse.json({ error: 'Error checking settings' }, { status: 500 });
      }

      if (existingSettings) {
        // Update existing settings
        const { data: settings, error: settingsUpdateError } = await supabase
          .from('settings')
          .update(cleanSettingsData)
          .eq('organization_id', orgId)
          .select()
          .single();

        if (settingsUpdateError) {
          console.error('Error updating settings:', settingsUpdateError);
          return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
        }

        updatedSettings = settings;
      } else {
        // Create new settings record
        const { data: settings, error: settingsCreateError } = await supabase
          .from('settings')
          .insert({
            organization_id: orgId,
            ...cleanSettingsData
          })
          .select()
          .single();

        if (settingsCreateError) {
          console.error('Error creating settings:', settingsCreateError);
          return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
        }

        updatedSettings = settings;
      }
    }

    // Update or create website_hero if data provided
    if (heroData) {
      // Check if hero record exists
      const { data: existingHero, error: existingHeroError } = await supabase
        .from('website_hero')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (existingHeroError && existingHeroError.code !== 'PGRST116') {
        console.error('Error checking existing hero:', existingHeroError);
        return NextResponse.json({ error: 'Error checking hero data' }, { status: 500 });
      }

      if (existingHero) {
        // Update existing hero
        const { data: hero, error: heroUpdateError } = await supabase
          .from('website_hero')
          .update(heroData)
          .eq('organization_id', orgId)
          .select()
          .single();

        if (heroUpdateError) {
          console.error('Error updating hero:', heroUpdateError);
          return NextResponse.json({ error: 'Failed to update hero data' }, { status: 500 });
        }

        updatedHero = hero;
      } else {
        // Create new hero record
        const { data: hero, error: heroCreateError } = await supabase
          .from('website_hero')
          .insert({
            organization_id: orgId,
            ...heroData
          })
          .select()
          .single();

        if (heroCreateError) {
          console.error('Error creating hero:', heroCreateError);
          return NextResponse.json({ error: 'Failed to create hero data' }, { status: 500 });
        }

        updatedHero = hero;
      }
    }

    // Update menu items if data provided
    if (menuItems && Array.isArray(menuItems)) {
      // First, delete all existing menu items for this organization
      const { error: deleteError } = await supabase
        .from('website_menuitem')
        .delete()
        .eq('organization_id', orgId);

      if (deleteError) {
        console.error('Error deleting existing menu items:', deleteError);
        return NextResponse.json({ error: 'Failed to delete existing menu items' }, { status: 500 });
      }

      // Insert new menu items if any provided
      if (menuItems.length > 0) {
        const menuItemsWithOrgId = menuItems.map((item, index) => {
          // Only include fields that exist in the database schema
          return {
            display_name: item.display_name,
            display_name_translation: item.display_name_translation,
            url_name: item.url_name,
            is_displayed: convertToBoolean(item.is_displayed),
            is_displayed_on_footer: convertToBoolean(item.is_displayed_on_footer),
            order: item.order || index + 1,
            organization_id: orgId
          };
        });

        const { data: insertedMenuItems, error: menuItemsError } = await supabase
          .from('website_menuitem')
          .insert(menuItemsWithOrgId)
          .select();

        if (menuItemsError) {
          console.error('Error creating menu items:', menuItemsError);
          return NextResponse.json({ error: 'Failed to create menu items' }, { status: 500 });
        }

        updatedMenuItems = insertedMenuItems;
      } else {
        updatedMenuItems = [];
      }
    }

    // Update submenu items if data provided
    if (submenuItems && Array.isArray(submenuItems)) {
      // First, delete all existing submenu items for this organization
      const { error: deleteSubmenuError } = await supabase
        .from('website_submenuitem')
        .delete()
        .eq('organization_id', orgId);

      if (deleteSubmenuError) {
        console.error('Error deleting existing submenu items:', deleteSubmenuError);
        return NextResponse.json({ error: 'Failed to delete existing submenu items' }, { status: 500 });
      }

      // Insert new submenu items if any provided
      if (submenuItems.length > 0) {
        // Create a mapping from old menu item IDs to new ones based on order/position
        const menuItemIdMapping: { [key: string]: number } = {};
        
        if (updatedMenuItems && Array.isArray(updatedMenuItems)) {
          // Map old menu items to new ones by order position
          const originalMenuItems = menuItems || [];
          updatedMenuItems.forEach((newMenuItem: any) => {
            const originalMenuItem = originalMenuItems.find((orig: any) => 
              orig.order === newMenuItem.order || orig.display_name === newMenuItem.display_name
            );
            if (originalMenuItem) {
              menuItemIdMapping[originalMenuItem.id] = newMenuItem.id;
            }
          });
        }

        const submenuItemsWithOrgId = submenuItems.map((item, index) => {
          // Use the new menu item ID from the mapping, or try to find it by other means
          const newMenuItemId = menuItemIdMapping[item.menu_item_id || item.website_menuitem_id] 
            || item.menu_item_id 
            || item.website_menuitem_id;
            
          return {
            name: item.name,
            url_name: item.url_name || item.url,
            order: item.order || index + 1,
            menu_item_id: newMenuItemId,
            organization_id: orgId
          };
        });

        const { data: insertedSubmenuItems, error: submenuItemsError } = await supabase
          .from('website_submenuitem')
          .insert(submenuItemsWithOrgId)
          .select();

        if (submenuItemsError) {
          console.error('Error creating submenu items:', submenuItemsError);
          return NextResponse.json({ error: 'Failed to create submenu items' }, { status: 500 });
        }

        updatedSubmenuItems = insertedSubmenuItems;
      } else {
        updatedSubmenuItems = [];
      }
    }

    // Update blog posts if data provided
    if (blogPosts && Array.isArray(blogPosts)) {
      // Get existing blog posts for this organization
      const { data: existingBlogPosts, error: existingBlogPostsError } = await supabase
        .from('blog_post')
        .select('id')
        .eq('organization_id', orgId);

      if (existingBlogPostsError) {
        console.error('Error fetching existing blog posts:', existingBlogPostsError);
        return NextResponse.json({ error: 'Failed to fetch existing blog posts' }, { status: 500 });
      }

      const existingIds = new Set(existingBlogPosts?.map(post => post.id) || []);
      const incomingIds = new Set(blogPosts.filter(post => post.id).map(post => post.id));

      // Delete blog posts that are no longer in the new list (but only if they're not referenced)
      const idsToDelete = Array.from(existingIds).filter(id => !incomingIds.has(id));
      
      if (idsToDelete.length > 0) {
        // Try to delete posts that aren't referenced by other tables
        for (const postId of idsToDelete) {
          const { error: deleteError } = await supabase
            .from('blog_post')
            .delete()
            .eq('id', postId)
            .eq('organization_id', orgId);

          if (deleteError && deleteError.code !== '23503') {
            // If it's not a foreign key constraint error, it's a real error
            console.error('Error deleting blog post:', deleteError);
            return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
          } else if (deleteError && deleteError.code === '23503') {
            // Foreign key constraint - just log it and continue
            console.log('Skipping deletion of blog post', postId, 'due to foreign key constraints');
          }
        }
      }

      // Upsert blog posts (update existing, insert new)
      if (blogPosts.length > 0) {
        // Filter out blog posts that don't have required fields
        const validBlogPosts = blogPosts.filter(post => 
          post.title && post.title.trim() !== '' && 
          post.slug && post.slug.trim() !== ''
        );
        
        if (validBlogPosts.length > 0) {
          const blogPostsWithOrgId = validBlogPosts.map((post, index) => {
            const postData: any = {
              title: post.title.trim(),
              slug: post.slug.trim(),
              description: post.description || '',
              content: post.content || '',
              order: parseInt(String(post.order)) || index + 1,
              display_this_post: convertToBoolean(post.display_this_post),
              display_as_blog_post: convertToBoolean(post.display_as_blog_post),
              organization_id: orgId,
              created_on: post.created_on || new Date().toISOString(),
              last_modified: new Date().toISOString()
            };
            
            // Only include ID if it exists (for updates), omit for new posts
            if (post.id) {
              postData.id = post.id;
            }
            
            return postData;
          });

        const { data: upsertedBlogPosts, error: blogPostsError } = await supabase
          .from('blog_post')
          .upsert(blogPostsWithOrgId, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select();

        if (blogPostsError) {
          console.error('Error upserting blog posts:', blogPostsError);
          return NextResponse.json({ error: 'Failed to save blog posts' }, { status: 500 });
        }

        updatedBlogPosts = upsertedBlogPosts;
        console.log('Successfully upserted blog posts:', upsertedBlogPosts);
        } else {
          updatedBlogPosts = [];
        }
      } else {
        updatedBlogPosts = [];
      }
    }

    // Update products if data provided
    if (products && Array.isArray(products)) {
      // Get existing products for this organization
      const { data: existingProducts, error: existingProductsError } = await supabase
        .from('product')
        .select('id')
        .eq('organization_id', orgId);

      if (existingProductsError) {
        console.error('Error fetching existing products:', existingProductsError);
        return NextResponse.json({ error: 'Failed to fetch existing products' }, { status: 500 });
      }

      const existingIds = new Set(existingProducts?.map(product => product.id) || []);
      const incomingIds = new Set(products.filter(product => product.id).map(product => product.id));

      // Delete products that are no longer in the new list (but only if they're not referenced)
      const idsToDelete = Array.from(existingIds).filter(id => !incomingIds.has(id));
      
      if (idsToDelete.length > 0) {
        // Try to delete products that aren't referenced by other tables
        for (const productId of idsToDelete) {
          const { error: deleteError } = await supabase
            .from('product')
            .delete()
            .eq('id', productId)
            .eq('organization_id', orgId);

          if (deleteError && deleteError.code !== '23503') {
            // If it's not a foreign key constraint error, it's a real error
            console.error('Error deleting product:', deleteError);
            return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
          } else if (deleteError && deleteError.code === '23503') {
            // Foreign key constraint - just log it and continue
            console.log('Skipping deletion of product', productId, 'due to foreign key constraints');
          }
        }
      }

      // Handle products (separate new inserts from updates)
      if (products.length > 0) {
        // Filter out products that don't have required fields
        const validProducts = products.filter(product => 
          product.product_name && product.product_name.trim() !== ''
        );
        
        if (validProducts.length > 0) {
        const productsToUpdate: any[] = [];
        const productsToInsert: any[] = [];

        validProducts.forEach((product, index) => {
          const baseProduct = {
            product_name: product.product_name.trim(),
            slug: product.slug || '',
            product_description: product.product_description || '',
            links_to_image: product.links_to_image || '',
            order: parseInt(String(product.order)) || index + 1,
            is_displayed: convertToBoolean(product.is_displayed),
            price_manual: product.price_manual || '',
            currency_manual_symbol: product.currency_manual_symbol || '$',
            product_tax_code: product.product_tax_code || '',
            product_sub_type_id: product.product_sub_type_id || null,
            organization_id: orgId,
            created_at: product.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            attrs: product.attrs || null
          };

          if (product.id) {
            // Existing product - add to update list
            productsToUpdate.push({
              id: product.id,
              ...baseProduct
            });
          } else {
            // New product - add to insert list (no id field)
            productsToInsert.push(baseProduct);
          }
        });

        updatedProducts = [];

        // Handle updates
        if (productsToUpdate.length > 0) {
          const { data: upsertedProducts, error: updateError } = await supabase
            .from('product')
            .upsert(productsToUpdate, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
            .select();

          if (updateError) {
            console.error('Error updating products:', updateError);
            return NextResponse.json({ error: 'Failed to update products' }, { status: 500 });
          }

          updatedProducts.push(...(upsertedProducts || []));
        }

        // Handle inserts
        if (productsToInsert.length > 0) {
          const { data: insertedProducts, error: insertError } = await supabase
            .from('product')
            .insert(productsToInsert)
            .select();

          if (insertError) {
            console.error('Error inserting products:', insertError);
            return NextResponse.json({ error: 'Failed to insert products' }, { status: 500 });
          }

          updatedProducts.push(...(insertedProducts || []));
        }

        console.log('Successfully processed products:', updatedProducts);
        } else {
          updatedProducts = [];
        }
      } else {
        updatedProducts = [];
      }
    }

    // Update features if data provided
    if (features && Array.isArray(features)) {
      // Get existing features for this organization
      const { data: existingFeatures, error: existingFeaturesError } = await supabase
        .from('feature')
        .select('id')
        .eq('organization_id', orgId);

      if (existingFeaturesError) {
        console.error('Error fetching existing features:', existingFeaturesError);
        return NextResponse.json({ error: 'Failed to fetch existing features' }, { status: 500 });
      }

      const existingIds = new Set(existingFeatures?.map(feature => feature.id) || []);
      const incomingIds = new Set(features.filter(feature => feature.id).map(feature => feature.id));

      // Delete features that are no longer in the new list (but only if they're not referenced)
      const idsToDelete = Array.from(existingIds).filter(id => !incomingIds.has(id));
      
      if (idsToDelete.length > 0) {
        // Try to delete features that aren't referenced by other tables
        for (const featureId of idsToDelete) {
          const { error: deleteError } = await supabase
            .from('feature')
            .delete()
            .eq('id', featureId)
            .eq('organization_id', orgId);

          if (deleteError && deleteError.code !== '23503') {
            // If it's not a foreign key constraint error, it's a real error
            console.error('Error deleting feature:', deleteError);
            return NextResponse.json({ error: 'Failed to delete feature' }, { status: 500 });
          } else if (deleteError && deleteError.code === '23503') {
            // Foreign key constraint - just log it and continue
            console.log('Skipping deletion of feature', featureId, 'due to foreign key constraints');
          }
        }
      }

      // Handle features (separate new inserts from updates)
      if (features.length > 0) {
        // Filter out features that don't have required fields
        const validFeatures = features.filter(feature => 
          feature.name && feature.name.trim() !== ''
        );
        
        if (validFeatures.length > 0) {
        const featuresToUpdate: any[] = [];
        const featuresToInsert: any[] = [];

        validFeatures.forEach((feature) => {
          const baseFeature = {
            name: feature.name.trim(),
            slug: feature.slug || '',
            content: feature.content || '',
            feature_image: feature.feature_image || '',
            display_content: convertToBoolean(feature.display_content),
            display_on_product_card: convertToBoolean(feature.display_on_product_card),
            type: feature.type || '',
            package: feature.package || '',
            organization_id: orgId,
            created_at: feature.created_at || new Date().toISOString()
          };

          if (feature.id) {
            // Existing feature - add to update list
            featuresToUpdate.push({
              id: feature.id,
              ...baseFeature
            });
          } else {
            // New feature - add to insert list (no id field)
            featuresToInsert.push(baseFeature);
          }
        });

        let updatedFeatures = [];

        // Handle updates
        if (featuresToUpdate.length > 0) {
          const { data: upsertedFeatures, error: updateError } = await supabase
            .from('feature')
            .upsert(featuresToUpdate, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
            .select();

          if (updateError) {
            console.error('Error updating features:', updateError);
            return NextResponse.json({ error: 'Failed to update features' }, { status: 500 });
          }

          updatedFeatures.push(...(upsertedFeatures || []));
        }

        // Handle inserts
        if (featuresToInsert.length > 0) {
          const { data: insertedFeatures, error: insertError } = await supabase
            .from('feature')
            .insert(featuresToInsert)
            .select();

          if (insertError) {
            console.error('Error inserting features:', insertError);
            return NextResponse.json({ error: 'Failed to insert features' }, { status: 500 });
          }

          updatedFeatures.push(...(insertedFeatures || []));
        }

        console.log('Successfully processed features:', updatedFeatures);
        } else {
          updatedFeatures = [];
        }
      } else {
        updatedFeatures = [];
      }
    }

    // Update FAQs if data provided
    if (faqs && Array.isArray(faqs)) {
      console.log('🚀🚀🚀 ============================================');
      console.log('🚀🚀🚀 STARTING FAQ PROCESSING');
      console.log('🚀🚀🚀 FAQ Count:', faqs.length);
      console.log('🚀🚀🚀 RAW FAQ DATA:', JSON.stringify(faqs, null, 2));
      console.log('🚀🚀🚀 ============================================');
      
      try {
      
      // Get existing FAQs for this organization
      const { data: existingFaqs, error: existingFaqsError } = await supabase
        .from('faq')
        .select('id')
        .eq('organization_id', orgId);

      if (existingFaqsError) {
        console.error('Error fetching existing FAQs:', existingFaqsError);
        return NextResponse.json({ error: 'Failed to fetch existing FAQs' }, { status: 500 });
      }

      const existingIds = new Set(existingFaqs?.map(faq => faq.id) || []);
      const incomingIds = new Set(faqs.filter(faq => faq.id).map(faq => faq.id));

      // Delete FAQs that are no longer in the new list (but only if they're not referenced)
      const idsToDelete = Array.from(existingIds).filter(id => !incomingIds.has(id));
      
      if (idsToDelete.length > 0) {
        // Try to delete FAQs that aren't referenced by other tables
        for (const faqId of idsToDelete) {
          const { error: deleteError } = await supabase
            .from('faq')
            .delete()
            .eq('id', faqId)
            .eq('organization_id', orgId);

          if (deleteError && deleteError.code !== '23503') {
            // If it's not a foreign key constraint error, it's a real error
            console.error('Error deleting FAQ:', deleteError);
            return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
          } else if (deleteError && deleteError.code === '23503') {
            // Foreign key constraint - just log it and continue
            console.log('Skipping deletion of FAQ', faqId, 'due to foreign key constraints');
          }
        }
      }

      // Handle FAQs (separate new inserts from updates)
      if (faqs.length > 0) {
        // Filter out FAQs that don't have required fields
        const validFaqs = faqs.filter(faq => 
          faq.question && faq.question.trim() !== '' && 
          faq.answer && faq.answer.trim() !== ''
        );
        
        if (validFaqs.length > 0) {
        const faqsToUpdate: any[] = [];
        const faqsToInsert: any[] = [];

        validFaqs.forEach((faq) => {
          console.log('Processing FAQ:', JSON.stringify(faq, null, 2));
          console.log('Processing FAQ with display_home_page:', faq.display_home_page, typeof faq.display_home_page);
          
          // Only include known FAQ fields to avoid passing through unexpected data
          const baseFaq = {
            question: faq.question.trim(),
            answer: faq.answer.trim(),
            section: faq.section || '',
            order: parseInt(String(faq.order)) || 1,
            display_order: convertToBoolean(faq.display_order), // Boolean, not integer!
            display_home_page: convertToBoolean(faq.display_home_page),
            is_help_center: convertToBoolean(faq.is_help_center),
            help_center_order: faq.help_center_order ? parseInt(String(faq.help_center_order)) : null,
            product_sub_type_id: faq.product_sub_type_id ? parseInt(String(faq.product_sub_type_id)) : null,
            organization_id: orgId
          };
          
          console.log('Converted FAQ object:', JSON.stringify(baseFaq, null, 2));

          if (faq.id) {
            // Existing FAQ - add to update list with ONLY the fields we want
            faqsToUpdate.push({
              id: faq.id,
              ...baseFaq
            });
          } else {
            // New FAQ - add to insert list (no id field)
            faqsToInsert.push(baseFaq);
          }
        });

        let processedFaqs = [];

        // Handle updates
        if (faqsToUpdate.length > 0) {
          console.log('Updating FAQs:', JSON.stringify(faqsToUpdate, null, 2));
          const { data: upsertedFaqs, error: updateError } = await supabase
            .from('faq')
            .upsert(faqsToUpdate, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
            .select();

          if (updateError) {
            console.error('Error updating FAQs:', updateError);
            console.error('FAQs that failed to update:', JSON.stringify(faqsToUpdate, null, 2));
            return NextResponse.json({ error: 'Failed to update FAQs' }, { status: 500 });
          }

          processedFaqs.push(...(upsertedFaqs || []));
        }

        // Handle inserts
        if (faqsToInsert.length > 0) {
          console.log('Inserting FAQs:', JSON.stringify(faqsToInsert, null, 2));
          const { data: insertedFaqs, error: insertError } = await supabase
            .from('faq')
            .insert(faqsToInsert)
            .select();

          if (insertError) {
            console.error('Error inserting FAQs:', insertError);
            console.error('FAQs that failed to insert:', JSON.stringify(faqsToInsert, null, 2));
            return NextResponse.json({ error: 'Failed to insert FAQs' }, { status: 500 });
          }

          processedFaqs.push(...(insertedFaqs || []));
        }

        updatedFaqs = processedFaqs;
        console.log('Successfully processed FAQs:', processedFaqs);
        } else {
          updatedFaqs = [];
        }
      } else {
        updatedFaqs = [];
      }
      
      } catch (faqError: any) {
        console.error('🚨🚨🚨 ============================================');
        console.error('🚨🚨🚨 FAQ PROCESSING ERROR');
        console.error('🚨🚨🚨 Error:', faqError);
        console.error('🚨🚨🚨 Error Message:', faqError?.message);
        console.error('🚨🚨🚨 Error Details:', faqError?.details);
        console.error('🚨🚨🚨 Error Code:', faqError?.code);
        console.error('🚨🚨🚨 ============================================');
        return NextResponse.json({ 
          error: 'Failed to update FAQs', 
          details: faqError?.message || String(faqError),
          code: faqError?.code 
        }, { status: 500 });
      }
    } else {
      updatedFaqs = [];
    }

    // Update banners if data provided
    if (banners && Array.isArray(banners)) {
      console.log('🎨🎨🎨 ============================================');
      console.log('🎨🎨🎨 STARTING BANNER PROCESSING');
      console.log('🎨🎨🎨 Banner Count:', banners.length);
      console.log('🎨🎨🎨 RAW BANNER DATA:', JSON.stringify(banners, null, 2));
      console.log('🎨🎨🎨 ============================================');
      
      try {
      
      // Get existing banners for this organization
      const { data: existingBanners, error: existingBannersError } = await supabase
        .from('banners')
        .select('id')
        .eq('organization_id', orgId);

      if (existingBannersError) {
        console.error('Error fetching existing banners:', existingBannersError);
        return NextResponse.json({ error: 'Failed to fetch existing banners' }, { status: 500 });
      }

      const existingIds = new Set(existingBanners?.map(banner => banner.id) || []);
      const incomingIds = new Set(banners.filter((banner: any) => banner.id).map((banner: any) => banner.id));

      // Delete banners that are no longer in the new list
      const idsToDelete = Array.from(existingIds).filter(id => !incomingIds.has(id));
      
      if (idsToDelete.length > 0) {
        console.log('Deleting removed banners:', idsToDelete);
        for (const bannerId of idsToDelete) {
          const { error: deleteError } = await supabase
            .from('banners')
            .delete()
            .eq('id', bannerId)
            .eq('organization_id', orgId);

          if (deleteError) {
            console.error('Error deleting banner:', deleteError);
            return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
          }
        }
      }

      // Handle banners (separate new inserts from updates)
      if (banners.length > 0) {
        const bannersToUpdate: any[] = [];
        const bannersToInsert: any[] = [];

        banners.forEach((banner: any) => {
          console.log('Processing banner:', JSON.stringify(banner, null, 2));
          
          // Validate UUID format (if ID exists)
          const isValidUUID = (id: string) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(id);
          };
          
          // If banner has an ID but it's not a valid UUID, treat it as a new banner
          const hasValidId = banner.id && isValidUUID(banner.id);
          
          const baseBanner = {
            position: banner.position || 'top',
            type: banner.type || 'permanent',
            is_active: convertToBoolean(banner.is_enabled || banner.is_active),
            content: banner.content || { text: '', banner_background: '#3b82f6', banner_content_style: 'text-white' },
            landing_content: banner.landing_content || null,
            open_state: banner.openState || banner.open_state || 'absent',
            dismissal_duration: banner.dismissal_duration ? parseInt(String(banner.dismissal_duration)) : null,
            page_paths: banner.page_paths || null,
            is_fixed_above_navbar: convertToBoolean(banner.isFixedAboveNavbar || banner.is_fixed_above_navbar),
            organization_id: orgId,
            end_date_promotion: banner.end_date_promotion || null,
            end_date_promotion_is_displayed: convertToBoolean(banner.end_date_promotion_is_displayed),
            start_at: banner.start_at || new Date().toISOString(),
            end_at: banner.end_at || null,
            priority: banner.priority ? parseInt(String(banner.priority)) : 1,
            target_audience: banner.target_audience || ['anonymous', 'member', 'returning']
          };
          
          console.log('Converted banner object:', JSON.stringify(baseBanner, null, 2));
          console.log('Banner has valid ID:', hasValidId, 'ID value:', banner.id);

          if (hasValidId) {
            // Existing banner with valid UUID - add to update list
            bannersToUpdate.push({
              id: banner.id,
              ...baseBanner
            });
          } else {
            // New banner or invalid ID - add to insert list (no id field)
            bannersToInsert.push(baseBanner);
          }
        });

        let processedBanners = [];

        // Handle updates
        if (bannersToUpdate.length > 0) {
          console.log('Updating banners:', bannersToUpdate);
          const { data: upsertedBanners, error: updateError } = await supabase
            .from('banners')
            .upsert(bannersToUpdate, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
            .select();

          if (updateError) {
            console.error('Error updating banners:', updateError);
            return NextResponse.json({ error: 'Failed to update banners' }, { status: 500 });
          }

          processedBanners.push(...(upsertedBanners || []));
        }

        // Handle inserts
        if (bannersToInsert.length > 0) {
          console.log('Inserting banners:', bannersToInsert);
          const { data: insertedBanners, error: insertError } = await supabase
            .from('banners')
            .insert(bannersToInsert)
            .select();

          if (insertError) {
            console.error('Error inserting banners:', insertError);
            return NextResponse.json({ error: 'Failed to insert banners' }, { status: 500 });
          }

          processedBanners.push(...(insertedBanners || []));
        }

        updatedBanners = processedBanners;
        console.log('Successfully processed banners:', processedBanners);
      } else {
        updatedBanners = [];
      }
      
      } catch (bannerError: any) {
        console.error('🚨🚨🚨 ============================================');
        console.error('🚨🚨🚨 BANNER PROCESSING ERROR');
        console.error('🚨🚨🚨 Error:', bannerError);
        console.error('🚨🚨🚨 Error Message:', bannerError?.message);
        console.error('🚨🚨🚨 Error Details:', bannerError?.details);
        console.error('🚨🚨🚨 Error Code:', bannerError?.code);
        console.error('🚨🚨🚨 ============================================');
        return NextResponse.json({ 
          error: 'Failed to update banners', 
          details: bannerError?.message || String(bannerError),
          code: bannerError?.code 
        }, { status: 500 });
      }
    } else {
      updatedBanners = banners || [];
    }

    // Cookie categories are global and read-only through organization API
    // They should be managed through a separate admin interface
    let updatedCookieCategories = cookie_categories || [];
    
    // Just return the current global categories without modification
    if (cookie_categories) {
      console.log('Cookie categories are global - skipping organization-level updates');
      
      // Fetch current global categories to return updated data
      const { data: currentCategories, error: fetchError } = await supabase
        .from('cookie_category')
        .select(`
          id,
          name,
          description,
          name_translation,
          description_translation,
          cookie_service (
            id,
            name,
            description,
            active,
            category_id
          )
        `)
        .order('id', { ascending: true });

      if (fetchError) {
        console.error('Error fetching current cookie categories:', fetchError);
        updatedCookieCategories = [];
      } else {
        updatedCookieCategories = currentCategories || [];
      }
    }

    // Update cookie services if data provided (organization-specific)
    if (cookie_services && Array.isArray(cookie_services)) {
      console.log('Processing cookie services update:', cookie_services.length, 'services');
      
      // Get existing cookie services for this organization
      const { data: existingServices, error: existingServicesError } = await supabase
        .from('cookie_service')
        .select('id')
        .eq('organization_id', orgId);

      if (existingServicesError) {
        console.error('Error fetching existing cookie services:', existingServicesError);
        return NextResponse.json({ error: 'Failed to fetch existing cookie services' }, { status: 500 });
      }

      const existingIds = new Set(existingServices?.map(service => service.id) || []);
      const incomingIds = new Set(cookie_services.filter((service: any) => service.id).map((service: any) => service.id));

      // Delete services that are no longer in the new list
      const idsToDelete = Array.from(existingIds).filter(id => !incomingIds.has(id));
      
      if (idsToDelete.length > 0) {
        console.log('Deleting removed cookie services:', idsToDelete);
        for (const serviceId of idsToDelete) {
          const { error: deleteError } = await supabase
            .from('cookie_service')
            .delete()
            .eq('id', serviceId)
            .eq('organization_id', orgId);

          if (deleteError) {
            console.error('Error deleting cookie service:', deleteError);
            return NextResponse.json({ error: 'Failed to delete cookie service' }, { status: 500 });
          }
        }
      }

      // Handle cookie services (separate new inserts from updates)
      if (cookie_services.length > 0) {
        const servicesToUpdate: any[] = [];
        const servicesToInsert: any[] = [];

        cookie_services.forEach((service: any) => {
          const baseService = {
            name: service.name || '',
            description: service.description || '',
            active: convertToBoolean(service.active),
            processing_company: service.processing_company || '',
            data_processor_cookie_policy_url: service.data_processor_cookie_policy_url || '',
            data_processor_privacy_policy_url: service.data_processor_privacy_policy_url || '',
            data_protection_officer_contact: service.data_protection_officer_contact || '',
            retention_period: service.retention_period || '',
            category_id: service.category_id || null,
            organization_id: orgId
          };

          if (service.id) {
            // Existing service - add to update list
            servicesToUpdate.push({
              id: service.id,
              ...baseService
            });
          } else {
            // New service - add to insert list
            servicesToInsert.push(baseService);
          }
        });

        let processedServices: any[] = [];

        // Handle updates
        if (servicesToUpdate.length > 0) {
          const { data: upsertedServices, error: updateError } = await supabase
            .from('cookie_service')
            .upsert(servicesToUpdate, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
            .select();

          if (updateError) {
            console.error('Error updating cookie services:', updateError);
            return NextResponse.json({ error: 'Failed to update cookie services' }, { status: 500 });
          }

          processedServices.push(...(upsertedServices || []));
        }

        // Handle inserts
        if (servicesToInsert.length > 0) {
          const { data: insertedServices, error: insertError } = await supabase
            .from('cookie_service')
            .insert(servicesToInsert)
            .select();

          if (insertError) {
            console.error('Error inserting cookie services:', insertError);
            return NextResponse.json({ error: 'Failed to insert cookie services' }, { status: 500 });
          }

          processedServices.push(...(insertedServices || []));
        }

        updatedCookieServices = processedServices;
        console.log('Successfully processed cookie services:', processedServices);
      } else {
        updatedCookieServices = [];
      }
    } else {
      updatedCookieServices = cookie_services || [];
    }

    // Cookie consent records are read-only (generated by user interactions)
    // They should not be editable through the organization API
    updatedCookieConsentRecords = cookie_consent_records || [];
    
    if (cookie_consent_records) {
      console.log('Cookie consent records are read-only - skipping updates');
      
      // Fetch current consent records to return updated data
      // First, get the user IDs that belong to this organization
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from('user_organization')
        .select('user_id')
        .eq('organization_id', orgId);

      if (orgUsersError) {
        console.error('Error fetching organization users for cookie consent:', orgUsersError);
        updatedCookieConsentRecords = [];
      } else if (orgUsers && orgUsers.length > 0) {
        const userIds = orgUsers.map(u => u.user_id);
        
        const { data: currentRecords, error: fetchError } = await supabase
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
          .limit(1000);

        if (fetchError) {
          console.error('Error fetching current cookie consent records:', fetchError);
          updatedCookieConsentRecords = [];
        } else {
          updatedCookieConsentRecords = currentRecords || [];
        }
      } else {
        // No users in this organization
        updatedCookieConsentRecords = [];
      }
    }

    // Revalidate cached pages that might use this organization's data
    try {
      console.log('Revalidating cached data for organization:', orgId);
      
      // Revalidate by organization-specific tags
      revalidateTag(`hero-${orgId}`);
      revalidateTag(`homepage-${orgId}`);
      revalidateTag('homepage');
      
      console.log(`Revalidated tags: hero-${orgId}, homepage-${orgId}, homepage`);
    } catch (revalidateError) {
      console.error('Error during cache revalidation:', revalidateError);
      // Don't fail the whole request if revalidation fails
    }

    // Structure menu items with nested submenu items for the admin interface
    let structuredMenuItems = updatedMenuItems;
    if (updatedMenuItems && updatedSubmenuItems && Array.isArray(updatedMenuItems) && Array.isArray(updatedSubmenuItems)) {
      structuredMenuItems = updatedMenuItems.map((menuItem: any) => ({
        ...menuItem,
        submenu_items: updatedSubmenuItems
          .filter((submenu: any) => submenu.menu_item_id === menuItem.id)
          .map((submenu: any) => ({
            ...submenu,
            // Map the field name to what the admin interface expects
            website_menuitem_id: submenu.menu_item_id,
            url: submenu.url_name, // Map url_name to url for admin interface
            is_visible: true, // Default since this field doesn't exist in database
            is_new_window: false // Default since this field doesn't exist in database
          }))
      }));
    }

    // Map banner field names for admin interface compatibility (same as GET)
    let mappedUpdatedBanners = updatedBanners;
    if (updatedBanners && Array.isArray(updatedBanners)) {
      mappedUpdatedBanners = updatedBanners.map((banner: any) => ({
        ...banner,
        is_enabled: banner.is_active, // Map database is_active to frontend is_enabled
        openState: banner.open_state, // Map database open_state to frontend openState
        isFixedAboveNavbar: Boolean(banner.is_fixed_above_navbar), // Map database field to frontend field
        isOpen: false, // Default for admin interface
        isDismissed: false // Default for admin interface
      }));
    }

    return NextResponse.json({
      success: true,
      organization: updatedOrg,
      settings: updatedSettings,
      website_hero: updatedHero,
      menu_items: structuredMenuItems,
      submenu_items: updatedSubmenuItems?.map((submenu: any) => ({
        ...submenu,
        // Map field names for admin interface compatibility
        website_menuitem_id: submenu.menu_item_id,
        url: submenu.url_name,
        is_visible: true,
        is_new_window: false
      })) || [],
      blog_posts: updatedBlogPosts || [],
      products: updatedProducts || [],
      features: updatedFeatures || [],
      faqs: updatedFaqs || [],
      banners: mappedUpdatedBanners || [],
      cookie_categories: updatedCookieCategories || [],
      cookie_services: updatedCookieServices || [],
      cookie_consent_records: updatedCookieConsentRecords || []
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing properties
    const { id } = await params;
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's session
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.user.id;
    const orgId = id;

    console.log('Delete organization request for:', orgId, 'by user:', userId);

    // Get user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, is_site_creator')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user's organization is 'platform' type
    if (!profile.organization_id) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const { data: currentOrg, error: currentOrgError } = await supabase
      .from('organizations')
      .select('type')
      .eq('id', profile.organization_id)
      .single();

    if (currentOrgError || !currentOrg) {
      return NextResponse.json({ error: 'Could not verify organization' }, { status: 500 });
    }

    // Permission validation - only platform admins can delete organizations
    if (currentOrg.type === 'platform' || currentOrg.type === 'general') {
      if (profile.role !== 'admin') {
        return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
      }

      // Prevent deleting the platform organization itself
      if (orgId === profile.organization_id) {
        return NextResponse.json({ error: 'Cannot delete the platform organization' }, { status: 403 });
      }

      // Check if the organization to delete was created by someone from the platform
      const { data: platformOrgUsers, error: usersError } = await supabase
        .from('profiles')
        .select('email')
        .eq('organization_id', profile.organization_id)
        .or('role.eq.admin,is_site_creator.eq.true');

      if (usersError) {
        return NextResponse.json({ error: 'Error verifying permissions' }, { status: 500 });
      }

      const creatorEmails = platformOrgUsers?.map((user: any) => user.email) || [];
      
      const { data: targetOrg, error: targetOrgError } = await supabase
        .from('organizations')
        .select('created_by_email, name')
        .eq('id', orgId)
        .single();
        
      if (targetOrgError || !targetOrg) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      
      if (!creatorEmails.includes(targetOrg.created_by_email)) {
        return NextResponse.json({ error: 'Access denied. You can only delete organizations created by your platform.' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Access denied. Only platform admins can delete organizations.' }, { status: 403 });
    }

    // Get organization name for logging before deletion
    const { data: orgToDelete, error: orgFetchError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    if (orgFetchError || !orgToDelete) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Delete the organization (this will cascade delete related records due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId);

    if (deleteError) {
      console.error('Error deleting organization:', deleteError);
      return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
    }

    console.log('Organization deleted successfully:', orgId);

    // Log the activity
    try {
      await logActivity({
        organizationId: orgId,
        action: 'deleted',
        details: `Organization "${orgToDelete.name}" was deleted by admin`,
        userEmail: user.user.email || 'unknown'
      });
    } catch (logError) {
      console.warn('Failed to log deletion activity:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ 
      message: 'Organization deleted successfully',
      organizationId: orgId,
      organizationName: orgToDelete.name
    });

  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
