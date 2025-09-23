import { DEFAULT_SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from './language-utils';

/**
 * Get the current locale from the pathname
 * @param pathname - Current pathname
 * @param defaultLocale - Default locale from database settings
 * @returns Current locale or default locale
 */
export function getCurrentLocale(pathname: string, defaultLocale: string = DEFAULT_LOCALE): Locale {
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  
  if (firstSegment && (DEFAULT_SUPPORTED_LOCALES as readonly string[]).includes(firstSegment)) {
    return firstSegment as Locale;
  }
  
  // Return the database default locale instead of hardcoded DEFAULT_LOCALE
  return defaultLocale as Locale;
}

/**
 * Create a localized URL based on current locale
 * @param href - Target URL
 * @param currentLocale - Current language locale
 * @param defaultLocale - Default language locale (from database)
 * @returns Localized URL
 */
export function createLocalizedUrl(href: string, currentLocale: Locale, defaultLocale: string = DEFAULT_LOCALE): string {
  // Remove leading slash for consistency
  const cleanHref = href.startsWith('/') ? href.slice(1) : href;
  
  // If the current locale is the default locale, don't add prefix
  if (currentLocale === defaultLocale) {
    return `/${cleanHref}`;
  }
  
  // For non-default locales, add the locale prefix
  return `/${currentLocale}/${cleanHref}`;
}

/**
 * Get path without locale prefix
 * @param pathname - Current pathname
 * @returns Path without locale prefix
 */
export function getPathWithoutLocale(pathname: string): string {
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  
  if (firstSegment && (DEFAULT_SUPPORTED_LOCALES as readonly string[]).includes(firstSegment)) {
    // Remove the locale segment
    const pathWithoutLocale = pathSegments.slice(1).join('/');
    return pathWithoutLocale ? `/${pathWithoutLocale}` : '/';
  }
  
  return pathname;
}

/**
 * Check if the current locale is the default locale
 * @param currentLocale - Current locale
 * @param defaultLocale - Default locale from database
 * @returns Boolean indicating if current locale is default
 */
export function isDefaultLocale(currentLocale: Locale, defaultLocale: string = DEFAULT_LOCALE): boolean {
  return currentLocale === defaultLocale;
}
