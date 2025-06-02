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

    // Fetch data from API routes
    const [heroResponse, brandsResponse, faqsResponse, templateSectionsResponse, templateHeadingSectionsResponse] = await Promise.all([
      fetch(`${baseUrl}/api/hero`, { cache: 'force-cache' }).catch(err => {
        console.error('Failed to fetch hero:', err);
        return null;
      }),
      fetch(`${baseUrl}/api/brands`, { cache: 'force-cache' }).catch(err => {
        console.error('Failed to fetch brands:', err);
        return null;
      }),
      fetch(`${baseUrl}/api/faqs`, { cache: 'force-cache' }).catch(err => {
        console.error('Failed to fetch faqs:', err);
        return null;
      }),
      fetch(`${baseUrl}/api/template-sections?url_page=/home`, { cache: 'force-cache' }).catch(err => {
        console.error('Failed to fetch template sections:', err);
        return null;
      }),
      fetch(`${baseUrl}/api/template-heading-sections?url_page=/home`, { cache: 'force-cache' }).catch(err => {
        console.error('Failed to fetch template heading sections:', err);
        return null;
      }),
    ]);

    // Process hero data
    let heroData = defaultData.hero;
    if (heroResponse && heroResponse.ok) {
      const data = await heroResponse.json();
      heroData = {
        ...data,
        h1_title: data.h1_title || 'Welcome to Our Platform',
        h1_text_color: data.h1_text_color || 'gray-900',
        is_h1_gradient_text: data.is_h1_gradient_text ?? false,
        h1_text_color_gradient_from: data.h1_text_color_gradient_from || 'gray-900',
        h1_text_color_gradient_via: data.h1_text_color_gradient_via || 'gray-700',
        h1_text_color_gradient_to: data.h1_text_color_gradient_to || 'gray-500',
        p_description: data.p_description || 'Discover our services.',
        p_description_color: data.p_description_color || '#000000',
        h1_title_color_id: data.h1_title_color_id || '',
        organization_id: data.organization_id || null,
      };
    } else if (heroResponse) {
      const errorData = await heroResponse.json();
      console.error('Error fetching hero data:', errorData.error || 'Unknown error');
    }

    // Process brands data
    let brandsData = defaultData.brands;
    if (brandsResponse && brandsResponse.ok) {
      brandsData = await brandsResponse.json();
    } else if (brandsResponse) {
      const errorData = await brandsResponse.json();
      console.error('Error fetching brands data:', errorData.error || 'Unknown error');
    }

    // Process faqs data
    let faqsData = defaultData.faqs;
    if (faqsResponse && faqsResponse.ok) {
      faqsData = await faqsResponse.json();
    } else if (faqsResponse) {
      const errorData = await faqsResponse.json();
      console.error('Error fetching faqs data:', errorData.error || 'Unknown error');
    }

    // Process template sections data
    let templateSectionsData = defaultData.templateSections;
    if (templateSectionsResponse && templateSectionsResponse.ok) {
      templateSectionsData = await templateSectionsResponse.json();
    } else if (templateSectionsResponse) {
      const errorData = await templateSectionsResponse.json();
      console.error('Error fetching template sections data:', errorData.error || 'Unknown error');
    }

    // Process template heading sections data
    let templateHeadingSectionsData = defaultData.templateHeadingSections;
    if (templateHeadingSectionsResponse && templateHeadingSectionsResponse.ok) {
      templateHeadingSectionsData = await templateHeadingSectionsResponse.json();
    } else if (templateHeadingSectionsResponse) {
      const errorData = await templateHeadingSectionsResponse.json();
      console.error('Error fetching template heading sections data:', errorData.error || 'Unknown error');
    }

    // Log fetched data
    console.log('Hero data:', heroData);
    console.log('Brands data:', brandsData);
    console.log('FAQs data:', faqsData);
    console.log('Template sections data:', templateSectionsData);
    console.log('Template heading sections data:', templateHeadingSectionsData);

    return {
      hero: heroData,
      brands: brandsData,
      faqs: faqsData,
      templateSections: templateSectionsData,
      templateHeadingSections: templateHeadingSectionsData,
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