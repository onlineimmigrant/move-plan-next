// API route for fetching specific sections of organization data
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch specific section data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; section: string }> }
) {
  try {
    const { id: orgId, section } = await params;

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

    console.log(`📥 GET Section: ${section} for org: ${orgId} by user: ${userId}`);

    // Get user's profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check permissions
    if (!profile.organization_id) {
      return NextResponse.json({ error: 'User must belong to an organization' }, { status: 403 });
    }

    const { data: currentOrg, error: currentOrgError } = await supabase
      .from('organizations')
      .select('type')
      .eq('id', profile.organization_id)
      .single();

    if (currentOrgError || !currentOrg) {
      return NextResponse.json({ error: 'Current organization not found' }, { status: 404 });
    }

    // Access control
    if (currentOrg.type !== 'platform' && currentOrg.type !== 'general') {
      if (profile.organization_id !== orgId) {
        return NextResponse.json({ error: 'Access denied. You can only view your own organization.' }, { status: 403 });
      }
    }

    let data: any = {};

    // Fetch data based on section
    switch (section) {
      case 'general':
        // Fetch organization and settings
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();

        if (orgError) {
          return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const { data: settings, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('organization_id', orgId)
          .single();

        data = {
          organization: org,
          settings: settings || {}
        };
        break;

      case 'hero':
        // Fetch hero/website data
        const { data: heroData, error: heroError } = await supabase
          .from('website_hero')
          .select('*')
          .eq('organization_id', orgId)
          .single();

        data = {
          website_hero: heroData || {}
        };
        break;

      case 'products':
        // Fetch products and pricing plans
        const { data: products, error: productsError } = await supabase
          .from('product')
          .select('*')
          .eq('organization_id', orgId)
          .order('order', { ascending: true });

        if (productsError) {
          console.error('Error fetching products:', productsError);
          return NextResponse.json({ error: 'Error fetching products' }, { status: 500 });
        }

        const { data: pricing_plans, error: pricingPlansError } = await supabase
          .from('pricingplan')
          .select('*')
          .eq('organization_id', orgId)
          .order('order', { ascending: true });

        if (pricingPlansError) {
          console.error('Error fetching pricing plans:', pricingPlansError);
        }

        data = {
          products: products || [],
          pricing_plans: pricing_plans || []
        };
        break;

      case 'features':
        // Fetch features
        const { data: features, error: featuresError } = await supabase
          .from('feature')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: true });

        data = {
          features: features || []
        };
        break;

      case 'faqs':
        // Fetch FAQs
        const { data: faqs, error: faqsError } = await supabase
          .from('faq')
          .select('*')
          .eq('organization_id', orgId)
          .order('help_center_order', { ascending: true });

        data = {
          faqs: faqs || []
        };
        break;

      case 'banners':
        // Fetch banners
        const { data: banners, error: bannersError } = await supabase
          .from('banners')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: true });

        if (bannersError) {
          console.error('Error fetching banners:', bannersError);
        }

        console.log(`📢 Fetched ${banners?.length || 0} banners for org ${orgId}`);

        data = {
          banners: banners || []
        };
        break;

      case 'menu':
        // Fetch menu items and submenu items
        const { data: menuItems, error: menuError } = await supabase
          .from('website_menuitem')
          .select('*')
          .eq('organization_id', orgId)
          .order('order', { ascending: true });

        const { data: submenuItems, error: submenuError } = await supabase
          .from('website_submenuitem')
          .select('*')
          .eq('organization_id', orgId)
          .order('order', { ascending: true });

        data = {
          menu_items: menuItems || [],
          submenu_items: submenuItems || []
        };
        break;

      case 'blog':
        // Fetch blog posts
        const { data: blogPosts, error: blogError } = await supabase
          .from('blog_post')
          .select('*')
          .eq('organization_id', orgId)
          .order('order', { ascending: true });

        data = {
          blog_posts: blogPosts || []
        };
        break;

      case 'cookies':
        // Fetch cookie data
        const { data: cookieCategories, error: categoriesError } = await supabase
          .from('cookie_category')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: true });

        const { data: cookieServices, error: servicesError } = await supabase
          .from('cookie_service')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: true });

        data = {
          cookie_categories: cookieCategories || [],
          cookie_services: cookieServices || []
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    console.log(`✅ Section ${section} fetched successfully:`, Object.keys(data));

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching section data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
