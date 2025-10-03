import createMiddleware from 'next-intl/middleware';
import { getSupportedLocales } from './lib/language-utils';
import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from './lib/getSettings';
import { getCurrencyByCountry } from './lib/currency';
import { getLanguageByCountry, detectLanguageFromSources } from './lib/language';

// Define known static routes that should always be handled by next-intl
const KNOWN_ROUTES = [
  '/',
  '/about-us',
  '/account',
  '/admin',
  '/basket',
  '/become-affiliate-partner',
  '/blog',
  '/cancel',
  '/checkout',
  '/color-shades',
  '/contact',
  '/course',
  '/developers',
  '/education-hub',
  '/faq',
  '/features',
  '/help-center',
  '/investors',
  '/login',
  '/products',
  '/referral-bonuses',
  '/register',
  '/register-free-trial',
  '/reset-password',
  '/sqe-2',
  '/success',
  '/support',
  '/terms',
  '/testik',
  '/university-partner-programme'
];

// Check if a path matches known route patterns
function isKnownRoute(pathname: string): boolean {
  // Remove locale prefix for checking
  const cleanPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  
  // Check exact matches
  if (KNOWN_ROUTES.includes(cleanPath)) {
    return true;
  }
  
  // Check known dynamic route patterns
  const dynamicPatterns = [
    /^\/sqe-2\/[^\/]+$/,
    /^\/account\/[^\/]+$/,
    /^\/admin\/[^\/]+$/,
    /^\/features\/[^\/]+$/,
    /^\/education-hub\/[^\/]+$/,
    /^\/products\/[^\/]+$/,
    // Add the [locale]/[slug] pattern - this should be handled by the component
    // We'll let it through to next-intl but mark it for validation
  ];
  
  return dynamicPatterns.some(pattern => pattern.test(cleanPath));
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Get the base URL for settings lookup
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host');
  const baseUrl = `${protocol}://${host}`;

  // Check for default locale cookie first
  const cookieLocale = request.cookies.get('defaultLocale')?.value;

  // Fetch database settings including supported locales
  let defaultLocale = cookieLocale || 'en'; // Use cookie first, then fallback
  let supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'it', 'pt', 'zh', 'ja', 'pl']; // fallback
  let baseCurrency = 'GBP'; // Use GBP as fallback to match your test data
  let settings: any = null; // Initialize settings variable outside try block
  
  try {
    settings = await getSettings(baseUrl);
    supportedLocales = getSupportedLocales(settings as any);
    const dbDefaultLocale = settings.language && supportedLocales.includes(settings.language) 
      ? settings.language 
      : 'en';
    
    // Use database setting if no cookie, or if cookie doesn't match database
    if (!cookieLocale || cookieLocale !== dbDefaultLocale) {
      defaultLocale = dbDefaultLocale;
    }
    
    // TODO: Add base_currency to organization settings table
    // For now, we'll use USD as the default fallback
    // baseCurrency = settings?.base_currency || 'USD';
    
    // Settings loaded successfully
    console.log('🌐 Middleware: Settings loaded, default locale:', defaultLocale);
  } catch (error) {
    console.error('Middleware: Failed to load settings, using fallback values');
  }

  // Note: We should NOT force redirects based on database default language
  // The home page should always be accessible at `/` and language switching should work
  // The database default language is used for content display, not URL structure

  // Use next-intl middleware with dynamic supported locales
  // Use the database default language as the default locale (no prefix)
  const intlMiddleware = createMiddleware({
    locales: supportedLocales,
    defaultLocale: defaultLocale, // Use database default language (no prefix)
    localePrefix: 'as-needed', // Default language has no prefix, others have prefixes
    localeDetection: false // Disable automatic browser language detection
  });

  // For potentially dynamic content routes (single slug patterns), let them through
  // but mark them for component-level validation
  const cleanPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  const isDynamicSlugPattern = /^\/[^\/]+$/.test(cleanPath) && cleanPath !== '/';
  
  if (isDynamicSlugPattern && !isKnownRoute(pathname)) {
    // Let it through to next-intl but the component will validate if content exists
    // If no content exists, the component should call notFound()
  }

  const response = intlMiddleware(request);
  
  // Add pathname to headers for SEO system access in layout
  response.headers.set('x-pathname', pathname);
  response.headers.set('x-url', request.nextUrl.pathname);
  
  // Add currency detection based on geolocation
  const geoCountry = (request as any).geo?.country;
  const cfCountry = request.headers.get('cf-ipcountry');
  const vercelCountry = request.headers.get('x-vercel-ip-country');
  const forwardedCountry = request.headers.get('x-forwarded-country');
  const realIpCountry = request.headers.get('x-real-ip-country');
  
  const country = geoCountry || vercelCountry || cfCountry || forwardedCountry || realIpCountry || 'US';
  
  // For local development without geolocation, use smart base currency detection
  // In production, use geolocation-based currency
  const isLocal = process.env.NODE_ENV === 'development';
  const hasGeolocationData = geoCountry || cfCountry || vercelCountry;
  
  let currency;
  if (isLocal && !hasGeolocationData) {
    // Local development: use base currency fallback
    currency = baseCurrency;
  } else {
    // Production or with geolocation: use country-based detection
    currency = getCurrencyByCountry(country, baseCurrency);
  }
  
  response.headers.set('x-user-currency', currency);
  response.headers.set('x-user-country', country);
  
  // Add language detection based on geolocation and browser preferences
  const acceptLanguage = request.headers.get('accept-language');
  let detectedLanguage;
  let shouldAutoSwitch = false;
  
  if (isLocal && !hasGeolocationData) {
    // Local development: use database default language or fallback
    detectedLanguage = defaultLocale;
  } else {
    // Production or with geolocation: use smart language detection
    detectedLanguage = detectLanguageFromSources(
      country,
      acceptLanguage || undefined,
      settings, // Pass settings object instead of just supportedLocales array
      defaultLocale
    );
    
    // Check if we should auto-switch (detected language is different from default)
    if (detectedLanguage !== defaultLocale && supportedLocales.includes(detectedLanguage)) {
      shouldAutoSwitch = true;
    }
  }
  
  response.headers.set('x-user-language', detectedLanguage);
  response.headers.set('x-should-auto-switch', shouldAutoSwitch.toString());
  
  // Set cookies for language detection and banner display
  response.cookies.set('detectedLanguage', detectedLanguage, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
    sameSite: 'lax'
  });
  
  // If auto-switch is needed and user hasn't dismissed, show banner
  if (shouldAutoSwitch) {
    const hasSeenBanner = request.cookies.get('languageBannerSeen')?.value;
    const hasDismissed = request.cookies.get('languageBannerDismissed')?.value;
    
    if (!hasSeenBanner && !hasDismissed) {
      // First time seeing auto-switch suggestion - show banner in detected language
      response.cookies.set('showLanguageBanner', 'true', {
        maxAge: 60 * 5, // 5 minutes
        path: '/',
        sameSite: 'lax'
      });
      response.cookies.set('bannerSourceLanguage', detectedLanguage, {
        maxAge: 60 * 5, // 5 minutes
        path: '/',
        sameSite: 'lax'
      });
      response.cookies.set('bannerTargetLanguage', defaultLocale, {
        maxAge: 60 * 5, // 5 minutes
        path: '/',
        sameSite: 'lax'
      });
    }
  }
  
  // Production logging (minimal)
  if (shouldAutoSwitch) {
    console.log('🌍 Language auto-switch triggered:', detectedLanguage, 'for country:', country);
  }
  
  return response;
}

export const config = {
  // Match all pathnames except for:
  // - API routes (/api/*)
  // - Static files (_next/*, _vercel/*)
  // - Image files and assets (with file extensions)
  // - Favicon and other root assets
  matcher: [
    // Include all routes that should be internationalized
    '/((?!api|_next|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\.[a-zA-Z0-9]+$).*)',
    // Also include the root path
    '/'
  ],
  // Enable Edge Runtime for Vercel geolocation
  runtime: 'experimental-edge'
};
