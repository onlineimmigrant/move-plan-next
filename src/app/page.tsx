import { getSettings, getOrganizationId } from '@/lib/getSettings';
import HomePage from './HomePage';
import { supabase } from '@/lib/supabase';
import { HomePageData } from '@/types/home_page_data';
import { MetaTags } from '@/components/MetaTags';
import { StructuredData } from '@/components/StructuredData';

async function fetchHomePageData(baseUrl: string): Promise<HomePageData> {
  const defaultData: HomePageData = {
    hero: {
      h1_title: 'Welcome to Our Platform',
      h1_text_color: 'gray-900',
      is_h1_gradient_text: false,
      h1_text_color_gradient_from: 'gray-900',
      h1_text_color_gradient_via: 'gray-700',
      h1_text_color_gradient_to: 'gray-500',
      p_description: 'Discover our services.',
      p_description_color: '#000000',
      h1_title_color_id: '',
      organization_id: null,
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
    console.log('Fetching homepage data with baseUrl:', baseUrl);

    // Resolve organizationId
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('No organization found for URL:', baseUrl, 'and no valid NEXT_PUBLIC_TENANT_ID');
      return defaultData;
    }

    console.log('Fetching homepage data for organization_id:', organizationId);

    // Fetch hero data
    const { data: heroData, error: heroError } = await supabase
      .from('website_hero')
      .select('*')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .single();

    if (heroError || !heroData) {
      console.error('Error fetching hero data:', heroError || 'No hero data found', 'organization_id:', organizationId);
    } else {
      console.log('Fetched hero data:', heroData);
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
      console.log('Fetched brands data:', brandsData);
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
      console.log('Fetched FAQs data:', faqsData);
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
            h1_title_color_id: heroData.h1_title_color_id || '',
            organization_id: heroData.organization_id || null,
          }
        : defaultData.hero,
      brands: brandsData || [],
      faqs: faqsData || [],
      templateSections: [], // Empty, as it will be fetched in ClientProviders
      templateHeadingSections: [], // Empty, as it will be fetched in ClientProviders
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

   

  return (
    <>

    <div>
      <h1 className="sr-only">{settings.site || 'Welcome'}</h1>
      <HomePage data={homePageData} />
    </div>
    </>
  );
}

export const revalidate = 3600; // Revalidate every hour