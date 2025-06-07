import { getSettings, getOrganizationId } from '@/lib/getSettings';
import { supabase } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import './globals.css';
import ClientProviders from './ClientProviders';
import { Settings } from '@/types/settings';
import Head from 'next/head';

interface SubMenuItem {
  id: number;
  name: string;
  url_name: string;
  order: number;
  description?: string;
  is_displayed?: boolean;
  organization_id: string | null;
}

interface ReactIcon {
  icon_name: string;
}

interface MenuItem {
  id: number;
  display_name: string;
  url_name: string;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  order: number;
  image?: string;
  react_icon_id?: number;
  react_icons?: ReactIcon | ReactIcon[];
  website_submenuitem?: SubMenuItem[];
  organization_id: string | null;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Skip Supabase queries during Vercel build
  const isBuild = process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_URL;
  if (isBuild) {
    console.log('Skipping Supabase queries during Vercel build');
    const defaultSettings: Settings = {
      id: 0,
      site: 'My Next.js App',
      image: '/images/logo.svg',
      organization_id: '',
      menu_width: '7xl',
      menu_items_are_text: true,
      footer_color: 'gray-800',
      favicon: '/images/favicon.png',
    };
    return (
      <html lang="en">
        <Head>
          <link rel="icon" href={defaultSettings.favicon} />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <body>
          <ClientProviders
            defaultSEOData={{
              title: 'My Next.js App',
              description: 'Sample admin app with Next.js 15',
              keywords: 'education, resources, app',
              canonicalUrl: 'http://localhost:3000',
              hreflang: [],
              faqs: [],
              structuredData: [],
            }}
            settings={defaultSettings}
            headerData={{
              image_for_privacy_settings: defaultSettings.image,
              site: defaultSettings.site,
              image: defaultSettings.image,
              disclaimer: `© ${new Date().getFullYear()} My Next.js App. All rights reserved.`,
            }}
            activeLanguages={['en', 'es', 'fr']}
            heroData={{ h1_text_color: 'gray-900', p_description_color: '#000000' }}
            baseUrl="http://localhost:3000"
            menuItems={[]}
          >
            {children}
          </ClientProviders>
        </body>
      </html>
    );
  }

  // Use centralized baseUrl logic
  const baseUrl = getBaseUrl(true);
  console.log('Base URL in RootLayout:', baseUrl);

  // Fetch settings for the organization
  let settings: Settings = {
    id: 0,
    site: 'My Next.js App',
    image: '/images/logo.svg',
    organization_id: '',
    menu_width: '7xl',
    menu_items_are_text: true,
    footer_color: 'gray-800',
    favicon: '/images/favicon.png',
  };
  try {
    settings = await getSettings(baseUrl);
    console.log('Fetched settings in layout:', settings);
  } catch (error) {
    console.error('Failed to fetch settings in layout:', error);
  }

  // Log favicon for debugging
  console.log('Favicon URL:', settings.favicon);

  // Fetch organization ID
  let organizationId: string | null = null;
  try {
    organizationId = await getOrganizationId(baseUrl);
    console.log('Fetched organizationId in layout:', organizationId);
  } catch (error) {
    console.error('Failed to fetch organizationId in layout:', error);
  }

  // Fetch site-wide FAQs
  let siteFaqs: { question: string; answer: string }[] = [];
  if (organizationId) {
    try {
      const { data, error } = await supabase
        .from('faq')
        .select('question, answer')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`);
      if (error) throw error;
      siteFaqs = data || [];
      console.log('Fetched siteFaqs in layout:', siteFaqs);
    } catch (error) {
      console.error('Failed to fetch FAQs in layout:', error);
    }
  } else {
    console.error('No organization ID found for FAQ fetch, URL:', baseUrl);
  }

  // Fetch hero data
  let heroData = {
    h1_text_color: 'gray-900',
    p_description_color: '#000000',
  };
  if (organizationId) {
    try {
      const { data, error } = await supabase
        .from('website_hero')
        .select('h1_text_color, p_description_color')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .single();
      if (error) throw error;
      heroData = {
        h1_text_color: data?.h1_text_color || 'gray-900',
        p_description_color: data?.p_description_color || '#000000',
      };
      console.log('Fetched heroData in layout:', heroData);
    } catch (error) {
      console.error('Failed to fetch hero data in layout:', error);
    }
  }

  // Fetch menu items
  let menuItems: MenuItem[] = [];
  if (organizationId) {
    try {
      const { data, error } = await supabase
        .from('website_menuitem')
        .select(`
          id,
          display_name,
          url_name,
          is_displayed,
          is_displayed_on_footer,
          "order",
          image,
          react_icon_id,
          organization_id,
          react_icons (icon_name),
          website_submenuitem (
            id,
            name,
            order,
            url_name,
            description,
            is_displayed,
            organization_id
          )
        `)
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .order('order', { ascending: true })
        .order('order', { ascending: true, referencedTable: 'website_submenuitem' });

      if (error) throw error;

      menuItems = (data || []).map((item) => {
        let reactIcons: ReactIcon | ReactIcon[] | undefined = item.react_icons;
        if (Array.isArray(item.react_icons)) {
          reactIcons = item.react_icons.length > 0 ? item.react_icons[0] : undefined;
        } else if (item.react_icons && typeof item.react_icons === 'object') {
          reactIcons = item.react_icons as ReactIcon;
        }

        return {
          ...item,
          react_icons: reactIcons,
          website_submenuitem: (item.website_submenuitem || []).filter(
            (subItem: SubMenuItem) =>
              subItem.is_displayed !== false &&
              (subItem.organization_id === null || subItem.organization_id === organizationId)
          ),
        };
      });
      console.log('Fetched menuItems in layout:', JSON.stringify(menuItems, null, 2));
    } catch (error) {
      console.error('Failed to fetch menu items in layout:', error);
    }
  } else {
    console.error('No organization ID found for menu fetch, URL:', baseUrl);
  }

  const headerData = {
    image_for_privacy_settings: settings.image,
    site: settings.site,
    image: settings.image,
    disclaimer: `© ${new Date().getFullYear()} ${settings.site || 'My Next.js App'}. All rights reserved.`,
  };

  const activeLanguages = ['en', 'es', 'fr'];

  const defaultSEOData = {
    title: settings.site || 'My Next.js App',
    description: 'Sample admin app with Next.js 15',
    keywords: 'education, resources, app',
    canonicalUrl: baseUrl,
    hreflang: activeLanguages.map((lang) => ({
      href: `${baseUrl}/${lang}`,
      hreflang: lang,
    })),
    faqs: siteFaqs,
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: settings?.site || baseUrl,
        url: baseUrl,
        description: 'Sample admin app with Next.js 15',
        publisher: {
          '@type': 'Organization',
          name: settings.site || 'Your Site Name',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/images/logo.svg`,
          },
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
        ],
      },
    ],
  };

  // Determine favicon URL with Supabase Storage support
  const faviconUrl = settings.favicon
    ? settings.favicon.startsWith('http')
      ? `${settings.favicon}?v=${settings.id}` // External URL with cache-busting
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/favicons/${settings.favicon}?v=${settings.id}` // Supabase Storage
    : '/images/favicon.png';

  return (
    <html lang="en">
      <Head>
        <link rel="icon" href={faviconUrl} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body>
        <ClientProviders
          defaultSEOData={defaultSEOData}
          settings={{ ...settings, baseUrl }}
          headerData={headerData}
          activeLanguages={activeLanguages}
          heroData={heroData}
          baseUrl={baseUrl}
          menuItems={menuItems}
        >
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

export const revalidate = 3600; // Revalidate every hour