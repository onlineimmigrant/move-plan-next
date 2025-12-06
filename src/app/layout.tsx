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
import { Inter, JetBrains_Mono } from 'next/font/google';

// Load only essential fonts upfront - others loaded via CSS dynamically
// This reduces initial bundle size from ~800KB to ~100KB
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  adjustFontFallback: true,
  variable: '--font-inter'
});

// JetBrains Mono for code blocks in chat - essential for code display
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  preload: false, // Not critical, load async
  fallback: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
  adjustFontFallback: true,
  variable: '--font-jetbrains-mono'
});

export const revalidate = 0;

// Fetch cookie categories at build time with ISR (24h cache)
async function getCookieCategories() {
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

export async function generateMetadata(): Promise<Metadata> {
  const currentDomain = await getDomain();
  const headersList = await headers();
  
  // Get full pathname WITH locale (e.g., /fr/about)
  const fullPathname = getPathnameFromHeaders(headersList);
  
  // Extract locale from pathname
  const currentLocale = extractLocaleFromPathname(fullPathname);
  
  // Get pathname WITHOUT locale for SEO data lookup (DB stores without locale)
  const pathnameWithoutLocale = stripLocaleFromPathname(fullPathname);
  
  // Use comprehensive SEO system (query DB with locale-stripped path)
  let seoData;
  try {
    seoData = await fetchPageSEOData(pathnameWithoutLocale, currentDomain);
  } catch (error) {
    console.error('❌ [Layout generateMetadata] Error fetching SEO data, using fallback:', error);
    seoData = await fetchDefaultSEOData(currentDomain, pathnameWithoutLocale);
  }

  const settings = await getSettingsWithFallback(currentDomain);
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
    title: seoData.title || siteName,
    description: seoData.description || 'Welcome to our platform',
    keywords: Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords,
    
    // Mobile optimization
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
    },
    
    // PWA theme color - responsive
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
    ],
    
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
  const currentDomain = await getDomain();
  
  // Get current pathname to extract locale
  const headersList = await headers();
  const pathname = getPathnameFromHeaders(headersList);
  
  // Extract locale from pathname for dynamic language setting
  const currentLocale = extractLocaleFromPathname(pathname);
  
  // Simple: replace underscore with hyphen, take first 2 chars
  const language = (currentLocale || 'en').replace('_', '-').substring(0, 2).toLowerCase();
  
  const organization = await getOrganization(currentDomain);
  const settings = organization ? await getSettings(currentDomain) : await getSettingsWithFallback(currentDomain);
  
  // Settings loaded

  const organizationId = organization?.id || null;

  const menuItems = organizationId ? await fetchMenuItems(organizationId) : [];
  
  // Fetch cookie categories at build time (cached)
  const cookieCategories = await getCookieCategories();
  
  // Check if user has already accepted cookies (server-side check)
  const cookieAccepted = headersList.get('cookie')?.includes('cookies_accepted=true') || false;

  // Server-side fetch of template sections for SSR to avoid SEO/SSR mismatch
  // Determine url_page (map '/' to '/home' to match DB convention)
  // IMPORTANT: Strip locale prefix before DB lookup (DB stores paths without locale)
  const pathWithoutLocale = stripLocaleFromPathname(pathname);
  const urlPage = pathWithoutLocale === '/' || pathWithoutLocale === '' ? '/home' : pathWithoutLocale;

  let templateSections: any[] = [];
  let templateHeadingSections: any[] = [];
  try {
    if (organizationId) {
      const orgParam = encodeURIComponent(String(organizationId));
      const urlParam = encodeURIComponent(urlPage);
      const baseUrl = currentDomain.startsWith('http') ? currentDomain : `https://${currentDomain}`;
      const [tsRes, thsRes] = await Promise.all([
        fetch(`${baseUrl}/api/template-sections?url_page=${urlParam}&organizationId=${orgParam}`, {
          // Let route handler ISR caching work
          next: { revalidate: 60 },
        }),
        fetch(`${baseUrl}/api/template-heading-sections?url_page=${urlParam}&organizationId=${orgParam}`, {
          next: { revalidate: 60 },
        })
      ]);

      if (!tsRes.ok) {
        console.error('[RootLayout] Error fetching template sections via API:', await tsRes.text());
      } else {
        templateSections = await tsRes.json();
      }

      if (!thsRes.ok) {
        console.error('[RootLayout] Error fetching template heading sections via API:', await thsRes.text());
      } else {
        templateHeadingSections = await thsRes.json();
      }
    }
  } catch (e) {
    console.error('[RootLayout] Unexpected error fetching template sections:', e);
    templateSections = [];
    templateHeadingSections = [];
  }

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
  const fontVarsClass = `${inter.variable} ${jetbrainsMono.variable}`;
  
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
        <link rel="icon" href={faviconUrl} />
        
        {/* DNS Prefetch & Preconnect for performance */}
        <link rel="dns-prefetch" href="https://rgbmdfaoowqbgshjuwwm.supabase.co" />
        <link rel="preconnect" href="https://rgbmdfaoowqbgshjuwwm.supabase.co" crossOrigin="anonymous" />
        
        {/* Google Fonts - both preconnects required */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pub.r2.wvservices.exchange" />
        <link rel="preconnect" href="https://pub.r2.wvservices.exchange" crossOrigin="anonymous" />
        
        {settings.google_tag && <GoogleTagManager gtmId={settings.google_tag} />}
        <SimpleLayoutSEO />
        
        {/* Suppress external resource errors in production */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Suppress console errors
                const originalError = window.console.error;
                window.console.error = function() {
                  const args = Array.from(arguments);
                  const errorStr = args.join(' ');
                  
                  const suppressPatterns = [
                    'ERR_CONNECTION_FAILED',
                    'videos.pexels.com',
                    'images.pexels.com',
                    'Failed to load resource',
                    'net::ERR_',
                    'pexels.com',
                  ];
                  
                  const shouldSuppress = suppressPatterns.some(pattern => 
                    errorStr.includes(pattern)
                  );
                  
                  if (!shouldSuppress) {
                    originalError.apply(console, arguments);
                  }
                };
                
                // Suppress resource loading errors from appearing in console
                window.addEventListener('error', function(e) {
                  if (e.target && (e.target.tagName === 'VIDEO' || e.target.tagName === 'IMG')) {
                    const src = e.target.src || e.target.currentSrc;
                    if (src && (src.includes('pexels.com') || src.includes('ERR_'))) {
                      e.stopPropagation();
                      e.preventDefault();
                      return false;
                    }
                  }
                }, true);
              })();
            `
          }}
        />
        
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
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}