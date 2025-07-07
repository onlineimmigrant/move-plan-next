import { getSettings, getOrganizationId } from '@/lib/getSettings';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';
import './globals.css';
import ClientProviders from './ClientProviders';
import { Settings } from '@/types/settings';
import { SubMenuItem, MenuItem, ReactIcon } from '@/types/menu';
import { fetchProductSEOData, fetchDefaultSEOData, fetchPageSEOData, SEOData } from '@/lib/supabase/seo';

export const revalidate = 0;

export async function generateMetadata(): Promise<any> {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('next-url') || headersList.get('pathname') || '/';
  const currentDomain = headersList.get('host')
    ? `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${headersList.get('host')}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  console.log('[Metadata] Headers:', JSON.stringify(Object.fromEntries(headersList.entries()), null, 2));
  console.log('[Metadata] Pathname:', pathname, 'Domain:', currentDomain);

  const normalizedPathname = pathname.toLowerCase().replace(/\/$/, '') || '';
  let seoData: Partial<SEOData> = {};
  const productMatch = normalizedPathname.match(/^\/products\/([^\/]+)$/);

  if (productMatch) {
    const id = productMatch[1];
    console.log('[Metadata] Fetching product SEO for id:', id);
    try {
      seoData = await fetchProductSEOData(id, currentDomain);
    } catch (error: any) {
      console.error('[Metadata] Product SEO error:', error.message);
      seoData = await fetchDefaultSEOData(currentDomain, normalizedPathname);
    }
  } else {
    console.log('[Metadata] Fetching page SEO for pathname:', normalizedPathname);
    try {
      seoData = await fetchPageSEOData(normalizedPathname, currentDomain);
    } catch (error: any) {
      console.error('[Metadata] Page SEO error:', error.message);
      seoData = await fetchDefaultSEOData(currentDomain, normalizedPathname);
    }
  }

  console.log('[Metadata] Final SEO Data:', JSON.stringify(seoData, null, 2));

  return {
    title: seoData.title || 'Default Title',
    description: seoData.description || 'Default Description',
    keywords: Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords,
    alternates: { canonical: seoData.canonicalUrl },
    openGraph: {
      title: seoData.title,
      description: seoData.description,
      url: seoData.seo_og_url || seoData.canonicalUrl,
      images: seoData.seo_og_image ? [{ url: seoData.seo_og_image }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.title,
      description: seoData.description,
      images: seoData.seo_og_image ? [seoData.seo_og_image] : [],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('next-url') || headersList.get('pathname') || '/';
  const currentDomain = headersList.get('host')
    ? `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${headersList.get('host')}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  console.log('[Layout] Headers:', JSON.stringify(Object.fromEntries(headersList.entries()), null, 2));
  console.log('[Layout] Pathname:', pathname, 'Domain:', currentDomain);

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
    billing_panel_stripe: '',
    google_tag: '',
  };

  let settings = defaultSettings;
  let organizationId: string | null = null;

  try {
    const fetchedSettings = await getSettings(currentDomain);
    if (fetchedSettings && typeof fetchedSettings === 'object') {
      settings = { ...defaultSettings, ...fetchedSettings };
    }
    console.log('[Layout] Settings:', JSON.stringify(settings, null, 2));
    organizationId = await getOrganizationId(currentDomain);
    console.log('[Layout] Organization ID:', organizationId);
  } catch (error: any) {
    console.error('[Layout] Failed to fetch settings or organizationId:', error.message);
  }

  let heroData = {
    h1_text_color: 'gray-900',
    p_description_color: '#000000',
  };
  if (organizationId) {
    try {
      const { data, error } = await supabase
        .from('website_hero')
        .select('image, h1_text_color, p_description_color')
        .or(`organization_id.eq.${organizationId || ''},organization_id.is.null`)
        .single();
      if (!error && data) {
        heroData = {
          h1_text_color: data.h1_text_color || 'gray-900',
          p_description_color: data.p_description_color || '#000000',
        };
      }
    } catch (error: any) {
      console.error('[Layout] Failed to fetch hero data:', error.message);
    }
  }

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

      console.log('[Layout] Menu items query error:', error);
      console.log('[Layout] Menu items raw data:', JSON.stringify(data, null, 2));

      if (!error && data) {
        menuItems = data.map((item) => {
          console.log('[Layout] Raw website_submenuitem for item:', item.id, JSON.stringify(item.website_submenuitem, null, 2));
          let reactIcons: ReactIcon | null = null;
          if (item.react_icons && typeof item.react_icons === 'object' && !Array.isArray(item.react_icons)) {
            reactIcons = item.react_icons as ReactIcon;
          }
          const filteredSubItems = (item.website_submenuitem || []).filter(
            (subItem: SubMenuItem) =>
              subItem.is_displayed !== false &&
              (subItem.organization_id === null || subItem.organization_id === organizationId)
          );
          console.log('[Layout] Filtered website_submenuitem for item:', item.id, JSON.stringify(filteredSubItems, null, 2));
          return {
            ...item,
            react_icons: reactIcons,
            website_submenuitem: filteredSubItems,
          };
        });
        console.log('[Layout] Final menuItems:', JSON.stringify(menuItems, null, 2));
      }
    } catch (error: any) {
      console.error('[Layout] Failed to fetch menu items:', error.message);
    }
  } else {
    console.log('[Layout] No organizationId, skipping menu items fetch');
  }

  const headerData = {
    image_for_privacy_settings: settings.image,
    site: settings.site,
    image: settings.image,
    disclaimer: `© ${new Date().getFullYear()} ${settings.site || 'Company'}. All rights reserved.`,
  };

  const activeLanguages = ['en', 'es', 'fr'];

  const faviconUrl = settings.favicon
    ? settings.favicon.startsWith('http')
      ? settings.favicon
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/favicons/${settings.favicon}`
    : '/images/favicon.ico';

  const normalizedPathname = pathname.toLowerCase().replace(/\/$/, '') || '';
  let seoData: Partial<SEOData> = {};
  const productMatch = normalizedPathname.match(/^\/products\/([^\/]+)$/);

  if (productMatch) {
    const id = productMatch[1];
    console.log('[Layout] Fetching product SEO for id:', id);
    try {
      seoData = await fetchProductSEOData(id, currentDomain);
    } catch (error: any) {
      console.error('[Layout] Product SEO error:', error.message);
      seoData = await fetchDefaultSEOData(currentDomain, normalizedPathname);
    }
  } else {
    console.log('[Layout] Fetching page SEO for pathname:', normalizedPathname);
    try {
      seoData = await fetchPageSEOData(normalizedPathname, currentDomain);
    } catch (error: any) {
      console.error('[Layout] Page SEO error:', error.message);
      seoData = await fetchDefaultSEOData(currentDomain, normalizedPathname);
    }
  }

  console.log('[Layout] Final SEO Data:', JSON.stringify(seoData, null, 2));

  return (
    <html lang="en">
      <head>
        <link rel="icon" href={faviconUrl} />

        {/* Google Tag Manager Script */}
        {settings.google_tag && (
          <>
            <script
              id="google-tag-manager"
              dangerouslySetInnerHTML={{
                __html: `
                  (function(w,d,s,l,i){
                    w[l]=w[l]||[];
                    w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
                    var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),
                        dl=l!='dataLayer'?'&l='+l:'';
                    j.async=true;
                    j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
                    f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${settings.google_tag}');
                `,
              }}
            />
          </>
        )}

        {(seoData.structuredData || []).map((data, index) => (
          <script
            key={`structured-data-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data, null, 2) }}
          />
        ))}
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        {settings.google_tag && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${settings.google_tag}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            ></iframe>
          </noscript>
        )}

        <ClientProviders
          settings={settings}
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