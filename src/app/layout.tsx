// src/app/layout.tsx
import { getSettings, getOrganizationId } from '@/lib/getSettings';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';
import { getBreadcrumbStructuredData } from '@/lib/getBreadcrumbs';
import './globals.css';
import ClientProviders from './ClientProviders';
import { Settings } from '@/types/settings';
import { SEOData } from '@/types/seo';
import { SubMenuItem, MenuItem, ReactIcon } from '@/types/menu';

// No need for local ReactIcon definition
// interface ReactIcon {
//   icon_name: string;
// }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let currentDomain = 'http://localhost:3000';
  let pathname = '/';
  try {
    const headersList = headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    currentDomain = `${protocol}://${host}`;
    pathname = headersList.get('x-invoke-path') || headersList.get('x-pathname') || '/';
    console.log('Headers:', { host, pathname, isHeadersInstance: headersList instanceof Headers });
  } catch (error) {
    console.error('Failed to get headers:', error);
    const fallbackHost = process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '') || 'localhost:3000';
    currentDomain = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${fallbackHost}`;
  }
  const isBuild = process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_URL;

  console.log(`${isBuild ? 'Build-time' : 'Runtime'} domain: ${currentDomain}, pathname: ${pathname}`);

  // Default settings
  const defaultSettings: Settings = {
    id: 0,
    site: 'App',
    image: '/images/logo.svg',
    organization_id: '',
    menu_width: '7xl',
    menu_items_are_text: true,
    footer_color: 'gray-800',
    favicon: '/images/favicon.ico',
    seo_title: null,
    seo_description: null,
    seo_keywords: null,
    seo_og_image: null,
    seo_twitter_card: null,
    seo_structured_data: [],
    domain: '',
  };

  // Fetch settings
  let settings = defaultSettings;
  try {
    const fetchedSettings = await getSettings(currentDomain);
    if (fetchedSettings && typeof fetchedSettings === 'object') {
      settings = { ...defaultSettings, ...fetchedSettings };
    }
    console.log('Settings:', JSON.stringify(settings, null, 2));
    console.log('SEO Structured Data Raw:', JSON.stringify(settings.seo_structured_data, null, 2));
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }

  // Fetch organization ID
  let organizationId: string | null = null;
  try {
    organizationId = await getOrganizationId(currentDomain);
    console.log('Organization ID:', organizationId);
  } catch (error) {
    console.error('Failed to fetch organizationId:', error);
  }

  // Fetch FAQs
  let siteFaqs: { question: string; answer: string }[] = [];
  let faqStructuredData: any = null;
  if (organizationId) {
    try {
      const { data, error } = await supabase
        .from('faq')
        .select('question, answer, order')
        .eq('organization_id', organizationId)
        .eq('display_home_page', true)
        .order('order', { ascending: true });

      if (error) throw error;
      siteFaqs = (data || []).map((faq) => ({
        question: faq.question?.trim() || '',
        answer: faq.answer?.trim() || '',
      }));

      if (siteFaqs.length > 0) {
        faqStructuredData = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: siteFaqs
            .filter((faq) => faq.question && faq.answer)
            .map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer.replace(/\n/g, ' ').trim(),
              },
            })),
        };
        console.log('FAQ JSON-LD:', JSON.stringify(faqStructuredData, null, 2));
      }
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    }
  }

  // Fetch hero data
  let heroData = {
    h1_text_color: 'gray-900',
    p_description_color: '#000000',
  };
  if (organizationId && !isBuild) {
    try {
      const { data, error } = await supabase
        .from('website_hero')
        .select('image, h1_text_color, p_description_color')
        .or(`organization_id.eq.${organizationId || ''},organization_id.is.null`)
        .single();
      if (error) throw error;
      heroData = {
        h1_text_color: data?.h1_text_color || 'gray-900',
        p_description_color: data?.p_description_color || '#000000',
      };
      console.log('Hero Data:', heroData);
    } catch (error) {
      console.error('Failed to fetch hero data:', error);
    }
  }

  // Fetch menu items
  let menuItems: MenuItem[] = [];
  if (organizationId && !isBuild) {
    try {
      const { data, error } = await supabase
        .from('website_menuitem')
        .select(`
          id,
          display_name,
          url_name,
          is_displayed,
          is_displayed_on_footer,
          order,
          image,
          react_icon_id,
          organization_id,
          react_icons (icon_name),
          website_submenuitem (
            id,
            name,
            url_name,
            order,
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
        let reactIcons: ReactIcon | null | undefined;
        if (item.react_icons && typeof item.react_icons === 'object') {
          reactIcons = Array.isArray(item.react_icons)
            ? item.react_icons[0] || null
            : item.react_icons as ReactIcon;
        } else {
          reactIcons = null;
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
      console.log('Menu Items:', JSON.stringify(menuItems, null, 2));
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  }

  const headerData = {
    image_for_privacy_settings: settings.image,
    site: settings.site,
    image: settings.image,
    disclaimer: `© ${new Date().getFullYear()} ${settings.site || 'Company'}. All rights reserved.`,
  };

  const activeLanguages = ['en', 'es', 'fr'];

  // Breadcrumb overrides and extra crumbs
  const breadcrumbOverrides: { segment: string; label: string; url?: string }[] = [];
  const extraCrumbs: { label: string; url?: string }[] = [];

  // Generate breadcrumb JSON-LD
  let breadcrumbStructuredData: any = null;
  try {
    breadcrumbStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: getBreadcrumbStructuredData({
        pathname,
        domain: currentDomain,
        overrides: breadcrumbOverrides,
        extraCrumbs,
      }),
    };
    console.log('Breadcrumb JSON-LD Object:', JSON.stringify(breadcrumbStructuredData, null, 2));
  } catch (error) {
    console.error('Failed to generate breadcrumb JSON-LD:', error);
  }

  const structuredData = [
    ...(Array.isArray(settings.seo_structured_data)
      ? settings.seo_structured_data.filter((data) => {
          if (!data || typeof data !== 'object') {
            console.warn('Skipping null or non-object seo_structured_data:', data);
            return false;
          }
          if (data['@type'] === 'BreadcrumbList') {
            console.warn('Excluding BreadcrumbList from seo_structured_data:', JSON.stringify(data, null, 2));
            return false;
          }
          return true;
        })
      : []),
    ...(breadcrumbStructuredData ? [breadcrumbStructuredData] : []),
    ...(faqStructuredData ? [faqStructuredData] : []),
  ].filter((data) => {
    if (!data || typeof data !== 'object') {
      console.warn('Skipping invalid structured data: null or non-object', data);
      return false;
    }
    try {
      if (!data['@context'] || !data['@type']) {
        console.warn('Skipping invalid structured data: missing @context or @type', JSON.stringify(data, null, 2));
        return false;
      }
      const jsonString = JSON.stringify(data, null, 2);
      if (!jsonString) {
        console.warn('Skipping invalid structured data: empty JSON string', data);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Skipping invalid structured data due to serialization error:', { data: JSON.stringify(data, null, 2), error });
      return false;
    }
  });

  console.log('Final Structured Data Array:', JSON.stringify(structuredData, null, 2));
  if (structuredData.length === 0) {
    console.warn('No valid structured data to render. Check settings.seo_structured_data, breadcrumbStructuredData, and faqStructuredData.');
  }

  const defaultSEOData: SEOData = {
    title: settings.seo_title || settings.site || 'App',
    description: settings.seo_description || 'Description',
    keywords: settings.seo_keywords || 'Keywords',
    canonicalUrl: `${currentDomain}${pathname}`,
    hreflang: activeLanguages.map((lang) => ({
      href: `${currentDomain}/${lang}${pathname === '/' ? '' : pathname}`,
      hreflang: lang,
    })),
    faqs: siteFaqs,
    structuredData,
    seo_og_image: settings.seo_og_image || undefined,
  };

  // Favicon URL
  const faviconUrl = settings.favicon
    ? settings.favicon.startsWith('http')
      ? settings.favicon
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/favicons/${settings.favicon}`
    : '/images/favicon.ico';

  return (
    <html lang="en">
      <head>
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
        {structuredData.map((data, index) => (
          <script
            key={`structured-data-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data, null, 2) }}
          />
        ))}
      </head>
      <body>
        <ClientProviders
          defaultSEOData={defaultSEOData}
          settings={{ ...settings, baseUrl: currentDomain }}
          headerData={headerData}
          activeLanguages={activeLanguages}
          heroData={heroData}
          baseUrl={currentDomain}
          menuItems={menuItems}
        >
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

export const revalidate = 3600;