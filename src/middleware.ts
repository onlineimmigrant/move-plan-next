import createMiddleware from 'next-intl/middleware';
import { getSupportedLocales } from './lib/language-utils';
import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from './lib/getSettings';
import { getCurrencyByCountry } from './lib/currency';

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
  
  try {
    const settings = await getSettings(baseUrl);
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
    
    console.log('🌐 MIDDLEWARE DEBUG:');
    console.log('   - Pathname:', pathname);
    console.log('   - Cookie locale:', cookieLocale);
    console.log('   - DB settings.language:', settings.language);
    console.log('   - DB default locale:', dbDefaultLocale);
    console.log('   - Final default locale:', defaultLocale);
    console.log('   - Final base currency (fallback):', baseCurrency);
    console.log('   - Supported locales:', supportedLocales);
    console.log('   - Headers origin:', request.headers.get('origin'));
    console.log('   - Headers referer:', request.headers.get('referer'));
  } catch (error) {
    console.error('Middleware - Error fetching settings:', error);
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
    console.log('🔍 DYNAMIC ROUTE: Allowing potential [locale]/[slug] route:', pathname);
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
  const country = geoCountry || cfCountry || vercelCountry || 'US';
  
  // For local development without geolocation, use smart base currency detection
  // In production, use geolocation-based currency
  const isLocal = process.env.NODE_ENV === 'development';
  const hasGeolocationData = geoCountry || cfCountry || vercelCountry;
  
  let currency;
  if (isLocal && !hasGeolocationData) {
    // Local development: use base currency fallback (will be GBP for your test data)
    currency = baseCurrency;
    console.log('   - Using local development base currency:', currency);
  } else {
    // Production or with geolocation: use country-based detection
    currency = getCurrencyByCountry(country, baseCurrency);
    console.log('   - Using geolocation-based currency:', currency);
  }
  
  response.headers.set('x-user-currency', currency);
  response.headers.set('x-user-country', country);
  
  console.log('🌍 GEOLOCATION DEBUG:');
  console.log('   - request.geo:', (request as any).geo);
  console.log('   - geoCountry:', geoCountry);
  console.log('   - cf-ipcountry header:', cfCountry);
  console.log('   - x-vercel-ip-country header:', vercelCountry);
  console.log('   - Final country:', country);
  console.log('   - Base currency:', baseCurrency);
  console.log('   - Detected currency:', currency);
  console.log('   - All headers:', Object.fromEntries(request.headers.entries()));
  
  console.log('📋 MIDDLEWARE RESULT:');
  console.log('   - Response status:', response.status);
  console.log('   - Response headers location:', response.headers.get('location'));
  console.log('   - Added x-pathname header:', pathname);
  
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
  ]
};
