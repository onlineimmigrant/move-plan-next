/**
 * Centralized pathname utilities for SEO metadata generation
 * 
 * Consolidates pathname extraction logic that was previously scattered across:
 * - src/app/layout.tsx
 * - src/components/LayoutSEO.tsx
 * - src/components/SimpleLayoutSEO.tsx
 */

import { headers } from 'next/headers';

/**
 * Extract pathname from Next.js headers with multiple fallback strategies
 * 
 * @param headersList - Next.js headers object
 * @returns Pathname string (e.g., "/en/about" or "/products/item-1")
 */
export function getPathnameFromHeaders(headersList: Headers): string {
  // Priority 1: Custom x-pathname header (set by middleware)
  const xPathname = headersList.get('x-pathname');
  if (xPathname) {
    return xPathname;
  }

  // Priority 2: Custom x-url header
  const xUrl = headersList.get('x-url');
  if (xUrl) {
    return xUrl;
  }

  // Priority 3: Extract from referer as fallback
  const referer = headersList.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return url.pathname;
    } catch (e) {
      console.warn('⚠️ [pathname-utils] Could not parse referer URL:', referer);
    }
  }

  // Ultimate fallback
  return '/';
}

/**
 * Extract locale from pathname
 * 
 * Supported locales: en, es, fr, de, ru, it, pt, zh, ja, pl, nl
 * 
 * @param pathname - Full pathname including locale (e.g., "/fr/about")
 * @returns Locale code (e.g., "fr") or default "en"
 */
export function extractLocaleFromPathname(pathname: string): string {
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  return localeMatch ? localeMatch[1] : 'en';
}

/**
 * Remove locale prefix from pathname for database lookups
 * 
 * Database stores paths without locale prefix:
 * - /en/about → /about
 * - /fr/products → /products
 * - /en/ → / (home)
 * 
 * @param pathname - Pathname with locale prefix
 * @returns Pathname without locale prefix
 */
export function stripLocaleFromPathname(pathname: string): string {
  const localePattern = /^\/(?:en|es|fr|de|ru|it|pt|zh|ja|pl|nl)(\/|$)/;
  const pathWithoutLocale = pathname.replace(localePattern, '/');
  
  // Normalize empty path to root
  return pathWithoutLocale === '' ? '/' : pathWithoutLocale;
}

/**
 * Normalize pathname for database queries
 * 
 * Maps common variations to database format:
 * - "/" or "" → "/home"
 * - "/en/" → "/home"
 * - Removes trailing slashes
 * 
 * @param pathname - Raw pathname
 * @param stripLocale - Whether to remove locale prefix (default: true)
 * @returns Normalized pathname for DB lookup
 */
export function normalizePathnameForDB(pathname: string, stripLocale: boolean = true): string {
  let normalized = pathname;
  
  // Remove locale if requested
  if (stripLocale) {
    normalized = stripLocaleFromPathname(normalized);
  }
  
  // Remove trailing slash (except for root)
  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  // Map root to /home (database convention)
  if (normalized === '/' || normalized === '') {
    return '/home';
  }
  
  return normalized;
}

/**
 * Get full pathname from headers (convenience wrapper)
 * 
 * @returns Promise<string> - Current pathname
 */
export async function getCurrentPathname(): Promise<string> {
  const headersList = await headers();
  return getPathnameFromHeaders(headersList);
}

/**
 * Get pathname without locale prefix (for SEO data fetching)
 * 
 * @returns Promise<string> - Pathname without locale
 */
export async function getPathnameWithoutLocale(): Promise<string> {
  const pathname = await getCurrentPathname();
  return stripLocaleFromPathname(pathname);
}

/**
 * Get current locale from headers
 * 
 * @returns Promise<string> - Current locale code
 */
export async function getCurrentLocale(): Promise<string> {
  const pathname = await getCurrentPathname();
  return extractLocaleFromPathname(pathname);
}

/**
 * Check if pathname represents the homepage
 * 
 * @param pathname - Pathname to check
 * @returns boolean - True if homepage
 */
export function isHomePage(pathname: string): boolean {
  const normalized = stripLocaleFromPathname(pathname);
  return normalized === '/' || normalized === '/home' || normalized === '';
}

/**
 * Build hreflang alternate URLs for all supported locales
 * 
 * @param baseUrl - Domain base URL
 * @param pathname - Current pathname (without locale)
 * @param supportedLocales - Array of locale codes
 * @returns Record<locale, url> - Mapping of locales to full URLs
 */
export function buildHreflangAlternates(
  baseUrl: string, 
  pathname: string,
  supportedLocales: string[]
): Record<string, string> {
  const alternates: Record<string, string> = {};
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanPathname = pathname === '/' ? '' : pathname;
  
  for (const locale of supportedLocales) {
    alternates[locale] = `${cleanBaseUrl}/${locale}${cleanPathname}`;
  }
  
  return alternates;
}
