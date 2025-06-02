// /app/page.tsx
import { getSettings, getOrganizationId } from '@/lib/getSettings';
import HomePage from './HomePage';
import { supabase } from '@/lib/supabase';
import { HomePageData } from '@/types/home_page_data';

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
    templateSections: [],
    templateHeadingSections: [],
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
    }

    // Fetch template sections data
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('website_templatesection')
      .select(`
        id,
        section_title,
        section_title_color,
        section_title_size,
        section_title_weight,
        section_description,
        section_description_color,
        section_description_size,
        section_description_weight,
        metric_title_color,
        metric_title_size,
        metric_title_weight,
        metric_description_color,
        metric_description_size,
        metric_description_weight,
        background_color,
        font_family,
        grid_columns,
        is_full_width,
        is_section_title_aligned_center,
        is_section_title_aligned_right,
        is_image_bottom,
        image_metrics_height,
        order,
        url_page,
        organization_id,
        website_templatesection_metrics!templatesection_id (
          metric_id,
          website_metric!metric_id (
            id,
            title,
            description,
            image,
            is_image_rounded_full,
            is_title_displayed,
            background_color,
            is_card_type,
            organization_id
          )
        )
      `)
      .eq('url_page', '/home')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true });

    if (sectionsError || !sectionsData) {
      console.error('Error fetching template sections data:', sectionsError || 'No template sections found', 'organization_id:', organizationId);
    }

    // Transform template sections data
    const transformedSections = sectionsData?.map(section => ({
      ...section,
      website_metric: section.website_templatesection_metrics
        ?.filter((metricLink: any) =>
          metricLink.website_metric?.organization_id === null ||
          metricLink.website_metric?.organization_id === organizationId
        )
        .map((metricLink: any) => metricLink.website_metric) || [],
    })) || [];

    console.log('Transformed template sections:', transformedSections);

    // Fetch template heading sections data
    const { data: headingsData, error: headingsError } = await supabase
      .from('website_templatesectionheading')
      .select(`
        id,
        name,
        name_part_2,
        name_part_3,
        description_text,
        button_text,
        url,
        url_page,
        image,
        background_color,
        font_family,
        text_color,
        button_color,
        button_text_color,
        text_size_h1,
        text_size_h1_mobile,
        text_size,
        font_weight_1,
        font_weight,
        h1_text_color,
        is_text_link,
        image_first,
        is_included_template_sections_active,
        organization_id
      `)
      .eq('url_page', '/home')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true });

    if (headingsError || !headingsData) {
      console.error('Error fetching template heading sections data:', headingsError || 'No heading sections found', 'organization_id:', organizationId);
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
      templateSections: transformedSections,
      templateHeadingSections: headingsData || [],
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
    <div>
      <h1 className="sr-only">{settings.site || 'Welcome'}</h1>
      <HomePage data={homePageData} />
    </div>
  );
}

export const revalidate = 3600; // Revalidate every hour