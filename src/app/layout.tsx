import { getSettings, getOrganizationId, getDefaultSettings, getSiteName, getOrganization } from '@/lib/getSettings';
import { headers } from 'next/headers';
import './globals.css';
import ClientProviders from './ClientProviders';
import { Settings } from '@/types/settings';
import { pageMetadataDefinitions } from '@/lib/page-metadata-definitions';
import { fetchMenuItems, getDomain, getSettingsWithFallback, getFaviconUrl, getLanguageFromSettings, getLocaleFromSettings } from '@/lib/layout-utils';
import { getSupportedLocales } from '@/lib/language-utils';
import { GoogleTagManager, GoogleTagManagerNoscript } from '@/components/GTMComponents';
import { Metadata } from 'next';
import { fetchPageSEOData, fetchDefaultSEOData } from '@/lib/supabase/seo';
import Script from 'next/script';
import LayoutSEO from '@/components/LayoutSEO';
import TestStructuredData from '@/components/TestStructuredData';
import SimpleLayoutSEO from '@/components/SimpleLayoutSEO';
import ClientStructuredDataInjector from '@/components/ClientStructuredDataInjector';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const currentDomain = await getDomain();
  const headersList = await headers();
  
  // Get current pathname from headers with fallbacks
  function getPathnameFromHeaders(headersList: Headers): string {
    const xPathname = headersList.get('x-pathname');
    const xUrl = headersList.get('x-url');
    const referer = headersList.get('referer');
    
    if (xPathname) return xPathname;
    if (xUrl) return xUrl;
    
    // Extract from referer as fallback
    if (referer) {
      try {
        const url = new URL(referer);
        return url.pathname;
      } catch (e) {
        console.warn('⚠️ [Layout generateMetadata] Could not parse referer URL:', referer);
      }
    }
    
    // Ultimate fallback
    return '/';
  }
  
  let pathname = getPathnameFromHeaders(headersList);
  
  // Handle locale paths for metadata generation
  const localePattern = /^\/(?:en|es|fr|de|ru|it|pt|zh|ja|pl|nl)(?:\/(.*))?$/;
  const localeMatch = pathname.match(localePattern);
  
  if (localeMatch) {
    // If it's just a locale (like /fr), treat as homepage for SEO
    const remainingPath = localeMatch[1];
    if (!remainingPath || remainingPath === '') {
      pathname = '/';
      console.log('🔍 [Layout generateMetadata] Treating locale path as homepage:', pathname);
    } else {
      pathname = '/' + remainingPath;
      console.log('🔍 [Layout generateMetadata] Converted locale path:', pathname);
    }
  }
  
  console.log('🔍 [Layout generateMetadata] Final pathname for SEO:', pathname);
  
  // Use comprehensive SEO system
  let seoData;
  try {
    seoData = await fetchPageSEOData(pathname, currentDomain);
    console.log('✅ [Layout generateMetadata] SEO data fetched from system:', seoData.title);
  } catch (error) {
    console.error('❌ [Layout generateMetadata] Error fetching SEO data, using fallback:', error);
    seoData = await fetchDefaultSEOData(currentDomain, pathname);
  }

  const settings = await getSettingsWithFallback(currentDomain);
  const siteName = getSiteName(settings);
  
  // Extract locale from pathname - pathname format: /en/... or /sk/... etc
  let currentLocale = 'en'; // default fallback
  const metadataLocaleMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (metadataLocaleMatch) {
    currentLocale = metadataLocaleMatch[1];
  }
  console.log('🌐 [Layout generateMetadata] Detected locale from pathname:', currentLocale);

  // Enhanced metadata with SEO system data
  return {
    title: seoData.title || siteName,
    description: seoData.description || 'Welcome to our platform',
    keywords: Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords,
    
    openGraph: {
      title: seoData.title || siteName,
      description: seoData.description || 'Welcome to our platform',
      url: seoData.canonicalUrl || currentDomain,
      siteName,
      images: [{ 
        url: seoData.seo_og_image || settings.seo_og_image || '/images/codedharmony.png', 
        width: 1200, 
        height: 630, 
        alt: seoData.title || siteName 
      }],
      locale: currentLocale,
      type: 'website',
    },
    
    twitter: {
      card: 'summary_large_image',
      title: seoData.title || siteName,
      description: seoData.description || 'Welcome to our platform',
      images: [seoData.seo_og_image || settings.seo_og_image || '/images/codedharmony.png'],
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    alternates: { 
      canonical: seoData.canonicalUrl || currentDomain 
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currentDomain = await getDomain();
  console.log('RootLayout - currentDomain:', currentDomain);
  
  // Get current pathname to extract locale
  const headersList = await headers();
  
  // Get current pathname from headers with fallbacks
  function getPathnameFromHeaders(headersList: Headers): string {
    const xPathname = headersList.get('x-pathname');
    const xUrl = headersList.get('x-url');
    const referer = headersList.get('referer');
    
    if (xPathname) return xPathname;
    if (xUrl) return xUrl;
    
    // Extract from referer as fallback
    if (referer) {
      try {
        const url = new URL(referer);
        return url.pathname;
      } catch (e) {
        console.warn('⚠️ [RootLayout] Could not parse referer URL:', referer);
      }
    }
    
    return '/';
  }
  
  const pathname = getPathnameFromHeaders(headersList);
  
  // Extract locale from pathname for dynamic language setting
  let currentLocale = 'en'; // default fallback
  const layoutLocaleMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (layoutLocaleMatch) {
    currentLocale = layoutLocaleMatch[1];
  }
  console.log('🌐 [RootLayout] Detected locale from pathname:', currentLocale);
  
  const organization = await getOrganization(currentDomain);
  const settings = organization ? await getSettings(currentDomain) : await getSettingsWithFallback(currentDomain);
  
  console.log('RootLayout - settings loaded:', !!settings);

  const organizationId = organization?.id || null;
  console.log('RootLayout - organizationId:', organizationId);

  const menuItems = organizationId ? await fetchMenuItems(organizationId) : [];
  console.log('RootLayout - menuItems:', menuItems.length, 'items fetched');
  
  // Use dynamic locale instead of static language from settings
  const language = currentLocale;

  const headerData = {
    image_for_privacy_settings: settings.image,
    site: settings.site,
    image: settings.image,
    disclaimer: `© ${new Date().getFullYear()} ${settings.site || 'Company'}. All rights reserved.`,
  };

  const faviconUrl = getFaviconUrl(settings.favicon || undefined);

  return (
    <html lang={language}>
      <head>
        <link rel="icon" href={faviconUrl} />
        {settings.google_tag && <GoogleTagManager gtmId={settings.google_tag} />}
        <SimpleLayoutSEO />
      </head>
      <body>
        {settings.google_tag && <GoogleTagManagerNoscript gtmId={settings.google_tag} />}
        <ClientProviders
          settings={settings}
          headerData={headerData}
          activeLanguages={getSupportedLocales(settings as any)}
          baseUrl={currentDomain}
          menuItems={menuItems}
        >
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}