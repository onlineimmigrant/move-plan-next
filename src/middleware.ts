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

  // Fetch database settings including supported locales
  let defaultLocale = 'en'; // fallback
  let supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'it', 'pt', 'zh', 'ja', 'pl']; // fallback
  
  try {
    const settings = await getSettings(baseUrl);
    supportedLocales = getSupportedLocales(settings as any);
    defaultLocale = settings.language && supportedLocales.includes(settings.language) 
      ? settings.language 
      : 'en';
  } catch (error) {
    console.error('Middleware - Error fetching settings:', error);
  }

  // Use next-intl middleware with dynamic supported locales
  const intlMiddleware = createMiddleware({
    locales: supportedLocales,
    defaultLocale: defaultLocale as any,
    localePrefix: 'as-needed' // Default language has no prefix, others have prefixes
  });

  return intlMiddleware(request);
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
