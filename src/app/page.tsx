// /app/page.tsx
import { getSettings, getOrganizationId } from '@/lib/getSettings';
import HomePage from './HomePage';
import { FAQ } from '@/types/faq';

interface HeroData {
  h1_title: string;
  h1_text_color: string;
  is_h1_gradient_text?: boolean;
  h1_text_color_gradient_from: string;
  h1_text_color_gradient_via: string;
  h1_text_color_gradient_to: string;
  p_description: string;
  p_description_color: string;
  background_color_home_page?: string;
  is_bg_gradient?: boolean;
  h1_title_color_id?: string;
  h1_via_gradient_color_id?: string;
  h1_to_gradient_color_id?: string;
  image_url?: string;
  is_image_full_page?: boolean;
  is_seo_title?: boolean;
  seo_title?: string;
  h1_text_size_mobile?: string;
  h1_text_size?: string;
  title_alighnement?: string;
  title_block_width?: string;
  title_block_columns?: number;
  p_description_size?: string;
  p_description_size_mobile?: string;
  p_description_weight?: string;
  image_first?: boolean;
  organization_id: string | null;
}

interface Brand {
  id: string;
  web_storage_address: string;
  name: string;
  organization_id: string | null;
}

interface TemplateSection {
  id: string;
  section_title: string;
  section_title_color?: string;
  section_title_size?: string;
  section_title_weight?: string;
  section_description?: string;
  section_description_color?: string;
  section_description_size?: string;
  section_description_weight?: string;
  metric_title_color?: string;
  metric_title_size?: string;
  metric_title_weight?: string;
  metric_description_color?: string;
  metric_description_size?: string;
  metric_description_weight?: string;
  background_color?: string;
  font_family?: string;
  grid_columns?: number;
  is_full_width?: boolean;
  is_section_title_aligned_center?: boolean;
  is_section_title_aligned_right?: boolean;
  is_image_bottom?: boolean;
  image_metrics_height?: string;
  order?: number;
  url_page?: string;
  organization_id?: string | null;
  website_metric: any[];
}

interface TemplateHeadingSection {
  id: string;
  name: string;
  name_part_2?: string;
  name_part_3?: string;
  description_text: string;
  button_text?: string;
  url?: string;
  url_page: string;
  image?: string;
  background_color?: string;
  font_family?: string;
  text_color?: string;
  button_color?: string;
  button_text_color?: string;
  text_size_h1?: string;
  text_size_h1_mobile?: string;
  text_size?: string;
  font_weight_1?: string;
  font_weight?: string;
  h1_text_color?: string;
  is_text_link?: boolean;
  image_first?: boolean;
  is_included_template_sections_active?: boolean;
  organization_id: string | null;
}

interface HomePageData {
  hero: HeroData;
  brands: Brand[];
  faqs: FAQ[];
  templateSections: TemplateSection[];
  templateHeadingSections: TemplateHeadingSection[];
  brands_heading: string;
  labels_default?: {
    button_main_get_started?: { url: string; text: string };
    button_explore?: string;
  };
}

async function fetchHomePageData(baseUrl: string): Promise<HomePageData> {
  try {
    console.log('Fetching homepage data with baseUrl:', baseUrl);

    // Ensure organizationId is resolved correctly
    const organizationId = await getOrganizationId(baseUrl);
    console.log('Resolved organizationId:', organizationId);

    if (!organizationId) {
      console.error('No organizationId resolved, falling back to NEXT_PUBLIC_TENANT_ID');
      const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
      if (!tenantId) {
        throw new Error('No organizationId found and NEXT_PUBLIC_TENANT_ID is not set');
      }
      console.log('Using NEXT_PUBLIC_TENANT_ID:', tenantId);
      // Use tenantId in fetch calls (we'll append it as a query parameter)
    }

    const [heroResponse, brandsResponse, faqsResponse, templateSectionsResponse, templateHeadingSectionsResponse] = await Promise.all([
      fetch(`${baseUrl}/api/hero${organizationId ? `?organizationId=${organizationId}` : `?tenantId=${process.env.NEXT_PUBLIC_TENANT_ID}`}`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/brands${organizationId ? `?organizationId=${organizationId}` : `?tenantId=${process.env.NEXT_PUBLIC_TENANT_ID}`}`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/faqs${organizationId ? `?organizationId=${organizationId}` : `?tenantId=${process.env.NEXT_PUBLIC_TENANT_ID}`}`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/template-sections?url_page=/home${organizationId ? `&organizationId=${organizationId}` : `&tenantId=${process.env.NEXT_PUBLIC_TENANT_ID}`}`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/template-heading-sections?url_page=/home${organizationId ? `&organizationId=${organizationId}` : `&tenantId=${process.env.NEXT_PUBLIC_TENANT_ID}`}`, { cache: 'force-cache' }),
    ]);

    // Log response statuses
    console.log('Hero response status:', heroResponse.status, heroResponse.statusText);
    console.log('Brands response status:', brandsResponse.status, brandsResponse.statusText);
    console.log('FAQs response status:', faqsResponse.status, faqsResponse.statusText);
    console.log('Template sections response status:', templateSectionsResponse.status, templateSectionsResponse.statusText);
    console.log('Template heading sections response status:', templateHeadingSectionsResponse.status, templateHeadingSectionsResponse.statusText);

    const heroData = await heroResponse.json();
    const brandsData = await brandsResponse.json();
    const faqsData = await faqsResponse.json();
    const templateSectionsData = await templateSectionsResponse.json();
    const templateHeadingSectionsData = await templateHeadingSectionsResponse.json();

    // Log fetched data
    console.log('Hero data:', heroData);
    console.log('Brands data:', brandsData);
    console.log('FAQs data:', faqsData);
    console.log('Template sections data:', templateSectionsData);
    console.log('Template heading sections data:', templateHeadingSectionsData);

    if (!heroResponse.ok) throw new Error(heroData.error || 'Failed to fetch hero data');
    if (!brandsResponse.ok) throw new Error(brandsData.error || 'Failed to fetch brands data');
    if (!faqsResponse.ok) throw new Error(faqsData.error || 'Failed to fetch FAQs data');
    if (!templateSectionsResponse.ok) throw new Error(templateSectionsData.error || 'Failed to fetch template sections');
    if (!templateHeadingSectionsResponse.ok) throw new Error(templateHeadingSectionsData.error || 'Failed to fetch template heading sections');

    return {
      hero: {
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
      },
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
    return {
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
  }
}

export default async function Page() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  console.log('Page - Using baseUrl:', baseUrl);

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