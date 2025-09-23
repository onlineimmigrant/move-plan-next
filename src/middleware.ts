import createMiddleware from 'next-intl/middleware';
import { getSupportedLocales } from './lib/language-utils';
import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from './lib/getSettings';

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
    
    console.log('🌐 MIDDLEWARE DEBUG:');
    console.log('   - Pathname:', pathname);
    console.log('   - Cookie locale:', cookieLocale);
    console.log('   - DB settings.language:', settings.language);
    console.log('   - DB default locale:', dbDefaultLocale);
    console.log('   - Final default locale:', defaultLocale);
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
  // Always use 'en' as the default locale for URL structure, regardless of database setting
  const intlMiddleware = createMiddleware({
    locales: supportedLocales,
    defaultLocale: 'en', // Always use English as the default (no prefix)
    localePrefix: 'as-needed', // English has no prefix, others have prefixes
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
