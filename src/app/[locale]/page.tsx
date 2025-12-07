import { getSettings, getOrganizationId } from '@/lib/getSettings';
import HomePage from '../../components/HomePageSections/HomePage';
import { supabase } from '@/lib/supabase';
import { HomePageData } from '@/types/home_page_data';
import SimpleLayoutSEO from '../../components/SimpleLayoutSEO';
//import { MetaTags } from '../../components/MetaTags';
//import { StructuredData } from '../../components/StructuredData';

async function fetchHomePageData(baseUrl: string): Promise<HomePageData> {
  const defaultData: HomePageData = {
    hero: {
      title: 'Welcome to Our Platform',
      description: 'Discover our services.',
      title_style: {
        color: 'gray-900',
        size: { desktop: 'text-xl', mobile: 'text-lg' },
        alignment: 'center',
        blockWidth: 'full',
        blockColumns: 1
      },
      description_style: {
        color: '#000000',
        size: { desktop: 'text-base', mobile: 'text-sm' },
        weight: 'normal'
      },
      background_style: {
        color: '#ffffff'
      },
      image_style: {
        fullPage: false,
        position: 'right'
      },
      button_style: {
        aboveDescription: false,
        isVideo: false
      },
      organization_id: '',
    },
    brands: [],
    faqs: [],
    templateSections: [], // Still needed in type, but won't be fetched
    templateHeadingSections: [], // Still needed in type, but won't be fetched
    brands_heading: '',
    labels_default: {
      button_main_get_started: { url: '/products', text: 'Get Started' },
      button_explore: 'Explore',
    },
  };

  try {
    // console.log('Fetching homepage data with baseUrl:', baseUrl);

    // Resolve organizationId - check for actual URL match first
    let organizationId = null;
    const isLocal = process.env.NODE_ENV === 'development';
    
    // Try to get organization by URL first (this should match the logic in products page)
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq(isLocal ? 'base_url_local' : 'base_url', baseUrl)
      .maybeSingle();

    if (orgData && !orgError) {
      organizationId = orgData.id;
      // console.log('Found organization by URL:', baseUrl, 'ID:', organizationId);
    } else {
      // Fallback to getOrganizationId for tenant lookup
      organizationId = await getOrganizationId(baseUrl);
      console.log('Using fallback organization ID:', organizationId);
    }

    if (!organizationId) {
      console.error('No organization found for URL:', baseUrl, 'and no valid NEXT_PUBLIC_TENANT_ID');
      return defaultData;
    }

    // console.log('Fetching homepage data for organization_id:', organizationId);

    // Fetch hero data
    const { data: heroData, error: heroError } = await supabase
      .from('website_hero')
      .select('*')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .single();

    if (heroError || !heroData) {
      console.error('Error fetching hero data:', heroError || 'No hero data found', 'organization_id:', organizationId);
    } else {
      // console.log('Fetched hero data:', heroData);
    }

    // Fetch brands data
    const { data: brandsData, error: brandsError } = await supabase
      .from('website_brand')
      .select(`
        id,
        web_storage_address,
        name,
        organization_id
      `)
      .eq('is_active', true)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`);

    if (brandsError || !brandsData) {
      console.error('Error fetching brands data:', brandsError || 'No brands data found', 'organization_id:', organizationId);
    } else {
      // console.log('Fetched brands data:', brandsData);
    }

    // Fetch FAQs data
    const { data: faqsData, error: faqsError } = await supabase
      .from('faq')
      .select('*')
      .eq('display_home_page', true)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true });

    if (faqsError || !faqsData) {
      console.error('Error fetching FAQs data:', faqsError || 'No FAQs data found', 'organization_id:', organizationId);
    } else {
      // console.log('Fetched FAQs data:', faqsData);
    }

    // Fetch template sections (for server-side rendering)
    const { data: templateSectionsData, error: templateSectionsError } = await supabase
      .from('website_templatesection')
      .select('*')
      .eq('url_page', '/home')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true });

    if (templateSectionsError) {
      console.error('Error fetching template sections:', templateSectionsError);
    }

    // Fetch template heading sections (for server-side rendering)
    const { data: templateHeadingSectionsData, error: templateHeadingSectionsError } = await supabase
      .from('website_templatesectionheading')
      .select('*')
      .eq('url_page', '/home')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true });

    if (templateHeadingSectionsError) {
      console.error('Error fetching template heading sections:', templateHeadingSectionsError);
    }

    return {
      hero: heroData
        ? {
            ...heroData,
            h1_title: heroData.h1_title || 'Welcome to Our Platform',
            h1_text_color: heroData.h1_text_color || 'gray-900',
            is_h1_gradient_text: heroData.is_h1_gradient_text ?? false,
            h1_text_color_gradient_from: heroData.h1_text_color_gradient_from || 'gray-900',
            h1_text_color_gradient_via: heroData.h1_text_color_gradient_via || 'gray-700',
            h1_text_color_gradient_to: heroData.h1_text_color_gradient_to || 'gray-500',
            p_description: heroData.p_description || 'Discover our services.',
            p_description_color: heroData.p_description_color || '#000000',
            organization_id: heroData.organization_id || null,
          }
        : defaultData.hero,
      brands: brandsData || [],
      faqs: faqsData || [],
      templateSections: templateSectionsData || [],
      templateHeadingSections: templateHeadingSectionsData || [],
      brands_heading: '',
      labels_default: {
        button_main_get_started: { url: '/products', text: 'Get Started' },
        button_explore: 'Explore',
      },
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return defaultData;
  }
}

export default async function Page() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const settings = await getSettings(baseUrl);
  const homePageData = await fetchHomePageData(baseUrl);

  // Extract first section image for preloading (LCP optimization)
  let firstImageUrl: string | null = null;
  
  // Combine and sort all sections by order
  const allSections = [
    ...(homePageData.templateSections || []).map(s => ({ ...s, type: 'template' as const })),
    ...(homePageData.templateHeadingSections || []).map(s => ({ ...s, type: 'heading' as const }))
  ].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Get first section's image if it exists
  const firstSection = allSections[0];
  if (firstSection) {
    if (firstSection.type === 'heading') {
      // TypeScript: firstSection is TemplateHeadingSection with type property
      const headingSection = firstSection as any; // Use any to access JSONB content field
      if (headingSection.content && typeof headingSection.content === 'object' && 'image' in headingSection.content) {
        firstImageUrl = headingSection.content.image;
      }
    } else if (firstSection.type === 'template') {
      const templateSection = firstSection as any;
      if (templateSection.image) {
        firstImageUrl = templateSection.image;
      }
    }
  }

  // console.log('🏠 [HomePage] Rendering home page with SimpleLayoutSEO');

  return (
    <>
      {/* Preload first section image for LCP optimization */}
      {firstImageUrl && (
        <link
          rel="preload"
          as="image"
          href={firstImageUrl}
          fetchPriority="high"
        />
      )}
      <SimpleLayoutSEO />
      <div>
        <h1 className="sr-only">{settings.site || 'Welcome'}</h1>
        <HomePage data={homePageData} />
      </div>
    </>
  );
}

// ============================================================================
// STATIC SITE GENERATION (SSG) - Marketing pages only
// ============================================================================
// Generate static pages for homepage in all locales at build time
// This eliminates database queries for the homepage = instant PageSpeed Insights
export const dynamic = 'force-static';
export const revalidate = false; // Fully static, no revalidation

// Pre-generate homepage for all supported locales
export async function generateStaticParams() {
  return [
    { locale: 'en' },
  ];
}
// ============================================================================