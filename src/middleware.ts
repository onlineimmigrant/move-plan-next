import createMiddleware from 'next-intl/middleware';
import { getSupportedLocales } from './lib/language-utils';
import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from './lib/getSettings';

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

  // Handle root path explicitly - redirect to default locale if it's not 'en'
  // This ensures the database default language is respected at the root
  if (pathname === '/' && defaultLocale !== 'en') {
    console.log('🔄 REDIRECTING: Root path to default locale:', defaultLocale);
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }
  
  // Also handle explicit /en paths - redirect to root if English is not the database default
  if (pathname === '/en' && defaultLocale !== 'en') {
    console.log('🔄 REDIRECTING: /en to default locale:', defaultLocale);
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  // Use next-intl middleware with dynamic supported locales
  // Always use 'en' as the default locale for URL structure, regardless of database setting
  const intlMiddleware = createMiddleware({
    locales: supportedLocales,
    defaultLocale: 'en', // Always use English as the default (no prefix)
    localePrefix: 'as-needed', // English has no prefix, others have prefixes
    localeDetection: false // Disable automatic browser language detection
  });

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
