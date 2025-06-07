import { getSettings, getOrganizationId } from '@/lib/getSettings';
import { supabase } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import { getBreadcrumbStructuredData } from '@/lib/getBreadcrumbs';
import './globals.css';
import ClientProviders from './ClientProviders';
import { Settings } from '@/types/settings';
import { SEOData } from '@/types/seo';
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
  // Skip Supabase queries during Vercel build, but attempt to fetch settings
  const isBuild = process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_URL;
  const baseUrl = getBaseUrl(true) || process.env.NEXT_PUBLIC_BASE_URL || 'https://default-domain.com';
  console.log(`${isBuild ? 'Build-time' : 'Runtime'} base URL:`, baseUrl);

  // Default settings as fallback
  const defaultSettings: Settings = {
    id: 0,
    site: 'My Next.js App',
    image: '/images/logo.svg',
    organization_id: '',
    menu_width: '7xl',
    menu_items_are_text: true,
    footer_color: 'gray-800',
    favicon: '/images/favicon.png',
    seo_title: null,
    seo_description: null,
    seo_keywords: null,
    seo_og_image: null,
    seo_twitter_card: null,
    seo_structured_data: null,
  };

  // Fetch settings
  let settings = defaultSettings;
  try {
    settings = await getSettings(baseUrl);
    console.log('Fetched settings in layout:', settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }

  if (isBuild) {
    console.log('Build-time settings:', settings);
    const defaultSEOData: SEOData = {
      title: settings.seo_title || settings.site || 'My Next.js App',
      description: settings.seo_description || 'Sample admin app with Next.js 15',
      keywords: settings.seo_keywords || 'education, resources, app',
      canonicalUrl: baseUrl,
      hreflang: [],
      faqs: [],
      structuredData: [
        ...(settings.seo_structured_data || []),
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: getBreadcrumbStructuredData({
            pathname: '/',
            baseUrl,
          }),
        },
      ],
      seo_og_image: settings.seo_og_image || undefined,
    };
    return (
      <html lang="en">
        <Head>
          <link rel="icon" href={settings.favicon || '/images/favicon.png'} />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{defaultSEOData.title}</title>
          <meta name="description" content={defaultSEOData.description} />
          <meta name="keywords" content={defaultSEOData.keywords} />
          {defaultSEOData.seo_og_image && (
            <>
              <meta property="og:title" content={defaultSEOData.title} />
              <meta property="og:description" content={defaultSEOData.description} />
              <meta property="og:image" content={defaultSEOData.seo_og_image} />
              <meta property="og:url" content={defaultSEOData.canonicalUrl} />
              <meta property="og:type" content="website" />
            </>
          )}
          {settings.seo_twitter_card && (
            <>
              <meta name="twitter:card" content={settings.seo_twitter_card} />
              <meta name="twitter:title" content={defaultSEOData.title} />
              <meta name="twitter:description" content={defaultSEOData.description} />
              {defaultSEOData.seo_og_image && <meta name="twitter:image" content={defaultSEOData.seo_og_image} />}
            </>
          )}
          <link rel="canonical" href={defaultSEOData.canonicalUrl} />
          {defaultSEOData.hreflang.map((link) => (
            <link key={link.hreflang} rel="alternate" href={link.href} hrefLang={link.hreflang} />
          ))}
          {defaultSEOData.structuredData.map((data, index) => (
            <script
              key={`structured-data-${index}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
            />
          ))}
        </Head>
        <body>
          <ClientProviders
            defaultSEOData={defaultSEOData}
            settings={settings}
            headerData={{
              image_for_privacy_settings: settings.image,
              site: settings.site,
              image: settings.image,
              disclaimer: `© ${new Date().getFullYear()} Company. All rights reserved.`,
            }}
            activeLanguages={['en', 'es', 'fr']}
            heroData={{ h1_text_color: 'gray-900', p_description_color: '#000000' }}
            baseUrl={baseUrl}
            menuItems={[]}
          >
            {children}
          </ClientProviders>
        </body>
      </html>
    );
  }

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

  // Get current pathname (server-side)
  const pathname = new URL(baseUrl).pathname || '/';

  // Generate dynamic breadcrumb structured data
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: getBreadcrumbStructuredData({ pathname, baseUrl }),
  };

  const defaultSEOData: SEOData = {
    title: settings.seo_title || settings.site || 'My Next.js App',
    description: settings.seo_description || 'Sample admin app with Next.js 15',
    keywords: settings.seo_keywords || 'education, resources, app',
    canonicalUrl: baseUrl,
    hreflang: activeLanguages.map((lang) => ({
      href: `${baseUrl}/${lang}`,
      hreflang: lang,
    })),
    faqs: siteFaqs,
    structuredData: [
      ...(settings.seo_structured_data || []),
      breadcrumbStructuredData,
    ],
    seo_og_image: settings.seo_og_image || undefined,
  };

  // Determine favicon URL
  const faviconUrl = settings.favicon
    ? settings.favicon.startsWith('http')
      ? settings.favicon
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/favicons/${settings.favicon}`
    : '/images/favicon.png';

  return (
    <html lang="en">
      <Head>
        <link rel="icon" href={faviconUrl} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{defaultSEOData.title}</title>
        <meta name="description" content={defaultSEOData.description} />
        <meta name="keywords" content={defaultSEOData.keywords} />
        {defaultSEOData.seo_og_image && (
          <>
            <meta property="og:title" content={defaultSEOData.title} />
            <meta property="og:description" content={defaultSEOData.description} />
            <meta property="og:image" content={defaultSEOData.seo_og_image} />
            <meta property="og:url" content={defaultSEOData.canonicalUrl} />
            <meta property="og:type" content="website" />
          </>
        )}
        {settings.seo_twitter_card && (
          <>
            <meta name="twitter:card" content={settings.seo_twitter_card} />
            <meta name="twitter:title" content={defaultSEOData.title} />
            <meta name="twitter:description" content={defaultSEOData.description} />
            {defaultSEOData.seo_og_image && <meta name="twitter:image" content={defaultSEOData.seo_og_image} />}
          </>
        )}
        <link rel="canonical" href={defaultSEOData.canonicalUrl} />
        {defaultSEOData.hreflang.map((link) => (
          <link key={link.hreflang} rel="alternate" href={link.href} hrefLang={link.hreflang} />
        ))}
        {defaultSEOData.structuredData.map((data, index) => (
          <script
            key={`structured-data-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
          />
        ))}
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