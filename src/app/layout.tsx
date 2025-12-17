import { getSettings, getOrganizationId, getDefaultSettings, getSiteName, getOrganization } from '@/lib/getSettings';
import { headers } from 'next/headers';
import './globals.css';
import ClientProviders from './ClientProviders';
import { Settings } from '@/types/settings';
import { pageMetadataDefinitions } from '@/lib/page-metadata-definitions';
import { fetchMenuItems, getDomain, getSettingsWithFallback, getFaviconUrl, getLanguageFromSettings, getLocaleFromSettings } from '@/lib/layout-utils';
import { getSupportedLocales } from '@/lib/language-utils';
import { getPathnameFromHeaders, extractLocaleFromPathname, stripLocaleFromPathname, buildHreflangAlternates } from '@/lib/seo/pathname-utils';
import { GoogleTagManager, GoogleTagManagerNoscript } from '@/components/GTMComponents';
import { Metadata } from 'next';
import { fetchPageSEOData, fetchDefaultSEOData } from '@/lib/supabase/seo';
import Script from 'next/script';
import LayoutSEO from '@/components/LayoutSEO';
import TestStructuredData from '@/components/TestStructuredData';
import SimpleLayoutSEO from '@/components/SimpleLayoutSEO';
import LanguageSuggestionBanner from '@/components/LanguageSuggestionBanner';
import { supabaseServer } from '@/lib/supabaseServerSafe';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';

import { cache } from 'react';
import { layoutCache } from '@/lib/layoutCache';

// Self-hosted Inter font for maximum performance - no external requests!
const inter = localFont({
  src: [
    {
      path: '../../public/fonts/inter-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'optional',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

// Self-hosted Poppins font
const poppins = localFont({
  src: [
    {
      path: '../../public/fonts/poppins-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/poppins-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/poppins-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-poppins',
  display: 'optional',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

// JetBrains Mono for code blocks - keeping from Google for now (rarely used)
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'optional',
  preload: false,
  fallback: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
  adjustFontFallback: true,
  variable: '--font-jetbrains-mono'
});

// ISR: Cache layout for 1 hour to reduce server response time
// This dramatically improves TTFB (Time to First Byte) by serving cached HTML
// First visitor pays the ~1.5s DB fetch cost, next visitors get instant response
export const revalidate = 3600; // Revalidate every hour

// Child pages can still control their own caching strategy
// Blog posts & products: force-static (full SSG with immutable cache)
// Admin pages: dynamic rendering (real-time updates)

// Fetch cookie categories at build time with ISR (24h cache) - internal implementation
async function _getCookieCategoriesInternal() {
  try {
    const { data, error } = await supabaseServer
      .from('cookie_category')
      .select('id, name, description, cookie_service(id, name, description, active)');
    
    if (error) {
      console.error('Error fetching cookie categories:', error);
      return [];
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching cookie categories:', error);
    return [];
  }
}

// Cached wrapper - deduplicates cookie category requests
const getCookieCategories = cache(_getCookieCategoriesInternal);

// Layout uses ISR (dynamic) to support headers() and metadata
// Child pages can still use SSG with force-static

// Separate viewport export to avoid Next.js warnings
export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
    ],
  };
}

export async function generateMetadata(): Promise<Metadata> {
  // CRITICAL OPTIMIZATION: Call headers() only ONCE and derive domain from it
  const headersList = await headers();
  
  // Derive domain without additional async call
  const host = headersList.get('host');
  const currentDomain = host
    ? `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${host}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // Get full pathname WITH locale (e.g., /fr/about)
  const fullPathname = getPathnameFromHeaders(headersList);
  
  // Extract locale from pathname
  const currentLocale = extractLocaleFromPathname(fullPathname);
  
  // Get pathname WITHOUT locale for SEO data lookup (DB stores without locale)
  const pathnameWithoutLocale = stripLocaleFromPathname(fullPathname);
  
  // CRITICAL: Fetch SEO data and settings in parallel
  const [seoDataResult, settings] = await Promise.all([
    fetchPageSEOData(pathnameWithoutLocale, currentDomain)
      .catch(() => fetchDefaultSEOData(currentDomain, pathnameWithoutLocale)),
    getSettingsWithFallback(currentDomain),
  ]);
  
  const seoData = seoDataResult;
  const siteName = getSiteName(settings);
  const supportedLocales = getSupportedLocales(settings);
  
  // Build canonical URL WITH locale (important for international SEO)
  const canonicalUrl = `${currentDomain.replace(/\/$/, '')}${fullPathname}`;
  
  // Build hreflang alternates for all supported languages
  const hreflangAlternates = buildHreflangAlternates(
    currentDomain,
    pathnameWithoutLocale,
    supportedLocales
  );
  
  // Determine og:type based on content
  const isBlogPost = pathnameWithoutLocale.includes('/blog/') || 
                     pathnameWithoutLocale.match(/^\/[^\/]+$/) !== null; // Single segment might be blog post
  const ogType = isBlogPost ? 'article' : 'website';

  // Enhanced metadata with SEO system data
  return {
    metadataBase: new URL(currentDomain),
    title: seoData.title || siteName,
    description: seoData.description || 'Welcome to our platform',
    keywords: Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords,
    
    // Web App Manifest
    manifest: '/manifest.json',
    
    // Apple Web App
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: siteName,
    },
    
    openGraph: {
      title: seoData.title || siteName,
      description: seoData.description || 'Welcome to our platform',
      url: canonicalUrl,
      siteName,
      images: [{ 
        url: seoData.seo_og_image || settings.seo_og_image || '/images/codedharmony.png', 
        width: 1200, 
        height: 630, 
        alt: seoData.title || siteName 
      }],
      locale: currentLocale,
      type: ogType,
      // Add article-specific metadata for blog posts
      ...(ogType === 'article' && seoData.articlePublishedTime && {
        publishedTime: seoData.articlePublishedTime,
        modifiedTime: seoData.articleModifiedTime,
        authors: seoData.articleAuthor ? [seoData.articleAuthor] : undefined,
      }),
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
      canonical: canonicalUrl,
      // Add hreflang for all supported languages
      languages: hreflangAlternates
    },
    
    // Add Organization structured data globally
    other: {
      'organization-schema': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteName,
        url: currentDomain,
        logo: `${currentDomain}/logo.png`,
        sameAs: [
          // Add your social media links here
          // 'https://twitter.com/yourhandle',
          // 'https://linkedin.com/company/yourcompany'
        ]
      })
    }
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // CRITICAL OPTIMIZATION: Call headers() only ONCE and derive everything from it
  // headers() is a blocking Next.js API that causes render delay
  const headersList = await headers();
  const pathname = getPathnameFromHeaders(headersList);
  const currentLocale = extractLocaleFromPathname(pathname);
  const language = currentLocale;
  
  // Derive domain from headers without additional await
  const host = headersList.get('host');
  let currentDomain = host
    ? `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${host}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  if (currentDomain.includes('localhost')) {
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      currentDomain = process.env.NEXT_PUBLIC_BASE_URL;
    } else if (process.env.VERCEL_URL) {
      currentDomain = `https://${process.env.VERCEL_URL}`;
    } else {
      currentDomain = 'https://www.moveplannext.com'; // Fallback to production domain
    }
  }
  
  // Try memory cache first (1-hour TTL) - instant response!
  const cacheKey = `layout-data-${currentDomain}`;
  const cachedData = layoutCache.get<{
    organization: any;
    settings: any;
    menuItems: any[];
    cookieCategories: any[];
  }>(cacheKey);
  
  let organization, settings, menuItems, cookieCategories;
  
  if (cachedData) {
    // Cache hit - zero latency!
    ({ organization, settings, menuItems, cookieCategories } = cachedData);
  } else {
    // CRITICAL OPTIMIZATION: Minimize blocking by fetching only essential data
    // Use Promise.allSettled to prevent one failure from blocking everything
    const [orgResult, cookiesResult] = await Promise.allSettled([
      getOrganization(currentDomain),
      getCookieCategories(),
    ]);
    
    organization = orgResult.status === 'fulfilled' ? orgResult.value : null;
    cookieCategories = cookiesResult.status === 'fulfilled' ? cookiesResult.value : [];
    
    // CRITICAL: Fetch settings and menuItems in parallel with fallbacks
    const organizationId = organization?.id || null;
    const [settingsResult, menuItemsResult] = await Promise.allSettled([
      organization 
        ? getSettings(currentDomain)
        : getSettingsWithFallback(currentDomain),
      organizationId ? fetchMenuItems(organizationId) : Promise.resolve([]),
    ]);
    
    settings = settingsResult.status === 'fulfilled' ? settingsResult.value : getDefaultSettings();
    menuItems = menuItemsResult.status === 'fulfilled' ? menuItemsResult.value : [];
    
    // Cache for subsequent requests
    layoutCache.set(cacheKey, {
      organization,
      settings,
      menuItems,
      cookieCategories,
    });
  }
  
  // CRITICAL OPTIMIZATION: Template sections are NOT critical for initial render
  // Fetch them asynchronously without blocking - they can stream in after initial paint
  const organizationId = organization?.id || settings?.organization_id;
  const pathnameWithoutLocale = stripLocaleFromPathname(pathname);
  const urlPage = pathnameWithoutLocale;
  
  // Start template sections fetch but don't await - pass promise to client
  // This eliminates another waterfall window
  let templateSections: any[] = [];
  let templateHeadingSections: any[] = [];
  
  // Only fetch if absolutely necessary for this page
  // Most pages don't use template sections, so skip the query
  const needsTemplateSections = urlPage === '/' || urlPage === '/home' || urlPage === '/about' || urlPage === '/contact';
  
  if (organizationId && needsTemplateSections) {
    try {
      // Use Promise.allSettled to prevent failures from blocking
      const [sectionsResult, headingsResult] = await Promise.allSettled([
        supabaseServer
          .from('template_section')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('url_page', urlPage)
          .order('order', { ascending: true }),
        supabaseServer
          .from('template_heading_section')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('url_page', urlPage)
          .order('order', { ascending: true }),
      ]);
      
      templateSections = sectionsResult.status === 'fulfilled' && sectionsResult.value.data ? sectionsResult.value.data : [];
      templateHeadingSections = headingsResult.status === 'fulfilled' && headingsResult.value.data ? headingsResult.value.data : [];
    } catch (error) {
      console.error('[Layout] Error fetching template sections:', error);
      // Continue with empty arrays - non-critical data
    }
  }
  
  // Quick cookie check (no async) - COMMENTED OUT FOR SSG TEST
  const cookieAccepted = headersList.get('cookie')?.includes('cookies_accepted=true') || false;

  const headerData = {
    image_for_privacy_settings: settings.image,
    site: settings.site,
    image: settings.image,
    disclaimer: `© ${new Date().getFullYear()} ${settings.site || 'Company'}. All rights reserved.`,
  };

  const faviconUrl = getFaviconUrl(settings.favicon || undefined);

  // Font selection logic - map settings.font_family to CSS variable
  const selectedFont = settings?.font_family || 'Inter';
  
  // Only load Inter + JetBrains Mono - other fonts loaded via CSS @import dynamically
  const fontVarsClass = `${inter.variable} ${poppins.variable} ${jetbrainsMono.variable}`;
  
  const selectedFontVar = (() => {
    // Map font names to CSS variables (defined in globals.css)
    switch (selectedFont) {
      case 'Mulish': return '--font-mulish';
      case 'Roboto': return '--font-roboto';
      case 'Poppins': return '--font-poppins';
      case 'Lato': return '--font-lato';
      case 'Open Sans': return '--font-opensans';
      case 'Montserrat': return '--font-montserrat';
      case 'Nunito': return '--font-nunito';
      case 'Raleway': return '--font-raleway';
      case 'Ubuntu': return '--font-ubuntu';
      case 'Merriweather': return '--font-merriweather';
      case 'Inter':
      default: return '--font-inter';
    }
  })();

  return (
    <html lang={language} data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <link rel="icon" href={faviconUrl} />
        
        {/* Preconnect to image CDNs for faster loading */}
        <link rel="preconnect" href="https://rgbmdfaoowqbgshjuwwm.supabase.co" />
        <link rel="preconnect" href="https://pub-6891bafd3bd54c36b02da71be2099135.r2.dev" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
        
        {/* Prefetch common API routes (browser cache warm-up) */}
        <link rel="prefetch" href="/api/products-summary" as="fetch" crossOrigin="anonymous" />
        <link rel="prefetch" href="/api/brands" as="fetch" crossOrigin="anonymous" />
        
        {/* Inline critical CSS for instant render - no blocking */}
        <style dangerouslySetInnerHTML={{ __html: `
          html{scroll-behavior:smooth;scroll-padding-top:0}
          body{margin:0;padding:0;padding-bottom:env(safe-area-inset-bottom);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
          *{font-family:var(${selectedFontVar},system-ui,-apple-system,sans-serif)}
          .scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}
          .scrollbar-none::-webkit-scrollbar{display:none}
          @keyframes fade-in-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
          .animate-fade-in-up{animation:fade-in-up .6s cubic-bezier(.4,0,.2,1)}
        `}} />
        
        {/* Preload critical self-hosted fonts for instant render */}
        {selectedFont === 'Poppins' ? (
          <>
            <link rel="preload" href="/fonts/poppins-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/poppins-600.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/poppins-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          </>
        ) : (
          <>
            <link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/inter-600.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/inter-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          </>
        )}
        
        {/* Conditionally load Google Fonts ONLY when selected (zero performance impact when not used) */}
        {selectedFont !== 'Inter' && selectedFont !== 'Poppins' && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
              rel="stylesheet"
              href={`https://fonts.googleapis.com/css2?family=${selectedFont.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`}
            />
          </>
        )}
        
        {/* DNS Prefetch & Preconnect for performance */}
        <link rel="dns-prefetch" href="https://rgbmdfaoowqbgshjuwwm.supabase.co" />
        <link rel="preconnect" href="https://rgbmdfaoowqbgshjuwwm.supabase.co" crossOrigin="anonymous" />
        
        {/* Keep Google Fonts preconnect for JetBrains Mono only */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pub.r2.wvservices.exchange" />
        <link rel="preconnect" href="https://pub.r2.wvservices.exchange" crossOrigin="anonymous" />
        
        {/* Async non-critical stylesheet (blog typography) - preload with low priority */}
        <link rel="preload" as="style" href="/styles/prose.css" />
        <noscript>
          <link rel="stylesheet" href="/styles/prose.css" />
        </noscript>
        
        {/* Print CSS - defer loading until print media query activates */}
        <link rel="stylesheet" href="/styles/print.css" media="print" />
        
        {settings.google_tag && <GoogleTagManager gtmId={settings.google_tag} />}
        
        {/* Mobile Status Bar Styling - Match header background */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1f2937" media="(prefers-color-scheme: dark)" />
        
        {/* iOS Safari Status Bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body 
        className={`${fontVarsClass} antialiased`} 
        style={{ 
          fontFamily: `var(${selectedFontVar}), system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
        }}
      >
        {settings.google_tag && <GoogleTagManagerNoscript gtmId={settings.google_tag} />}
        <ClientProviders
          settings={settings}
          headerData={headerData}
          activeLanguages={getSupportedLocales(settings as any)}
          baseUrl={currentDomain}
          menuItems={menuItems}
          cookieCategories={cookieCategories}
          cookieAccepted={cookieAccepted}
          templateSections={templateSections}
          templateHeadingSections={templateHeadingSections}
          pathnameFromServer={pathname}
        >
          <LanguageSuggestionBanner currentLocale={currentLocale} />
          <SimpleLayoutSEO />
          {children}
        </ClientProviders>
        
        {/* Error suppression script - defer to idle time to avoid blocking main thread */}
        <Script
          id="error-suppression"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const originalError = window.console.error;
                window.console.error = function() {
                  const args = Array.from(arguments);
                  const errorStr = args.join(' ');
                  const suppressPatterns = ['ERR_CONNECTION_FAILED','videos.pexels.com','images.pexels.com','Failed to load resource','net::ERR_','pexels.com'];
                  if (!suppressPatterns.some(p => errorStr.includes(p))) {
                    originalError.apply(console, arguments);
                  }
                };
                window.addEventListener('error', function(e) {
                  if (e.target && (e.target.tagName === 'VIDEO' || e.target.tagName === 'IMG')) {
                    const src = e.target.src || e.target.currentSrc;
                    if (src && (src.includes('pexels.com') || src.includes('ERR_'))) {
                      e.stopPropagation();
                      e.preventDefault();
                    }
                  }
                }, true);
              })();
            `
          }}
        />
        <Script
          id="async-prose-css"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var href = '/styles/prose.css';
                // Avoid duplicate insertion
                if (document.querySelector('link[rel=stylesheet][href="'+href+'"]')) return;
                var l = document.createElement('link');
                l.rel = 'stylesheet';
                l.href = href;
                l.media = 'all';
                document.head.appendChild(l);
              })();
            `
          }}
        />
      </body>
    </html>
  );
}