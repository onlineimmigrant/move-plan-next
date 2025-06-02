// /app/page.tsx
import { getSettings, getOrganizationId } from '@/lib/getSettings';
import HomePage from './HomePage';
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

    // Resolve organizationId (optional, since routes now handle it)
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('No organization found for URL:', baseUrl, 'and no valid NEXT_PUBLIC_TENANT_ID');
      return defaultData;
    }

    console.log('Fetching homepage data for organization_id:', organizationId);

    // Fetch data from API routes (removed organizationId query parameter)
    const [heroResponse, brandsResponse, faqsResponse, templateSectionsResponse, templateHeadingSectionsResponse] = await Promise.all([
      fetch(`${baseUrl}/api/hero`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/brands`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/faqs`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/template-sections?url_page=/home`, { cache: 'force-cache' }),
      fetch(`${baseUrl}/api/template-heading-sections?url_page=/home`, { cache: 'force-cache' }),
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