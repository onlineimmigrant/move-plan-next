// /app/page.tsx
import { getSettings } from '@/lib/getSettings';
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
  section_description: string;
  website_metric: any[];
}

interface HomePageData {
  hero: HeroData;
  brands: Brand[];
  faqs: FAQ[];
  templateSections: TemplateSection[];
  brands_heading: string;
  labels_default?: {
    button_main_get_started?: { url: string; text: string };
    button_explore?: string;
  };
}

async function fetchHomePageData(baseUrl: string): Promise<HomePageData> {
  try {
    const [heroResponse, brandsResponse, faqsResponse, templateSectionsResponse] = await Promise.all([
      fetch(`${baseUrl}/api/hero`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/brands`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/faqs`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/template-sections?url_page=/home`, { cache: 'force-cache' }),
    ]);

    const heroData = await heroResponse.json();
    const brandsData = await brandsResponse.json();
    const faqsData = await faqsResponse.json();
    const templateSectionsData = await templateSectionsResponse.json();

    if (!heroResponse.ok) throw new Error(heroData.error || 'Failed to fetch hero data');
    if (!brandsResponse.ok) throw new Error(brandsData.error || 'Failed to fetch brands data');
    if (!faqsResponse.ok) throw new Error(faqsData.error || 'Failed to fetch FAQs data');
    if (!templateSectionsResponse.ok) throw new Error(templateSectionsData.error || 'Failed to fetch template sections');

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