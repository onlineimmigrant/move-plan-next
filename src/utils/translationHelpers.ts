/**
 * Translation Helper Utilities
 * 
 * Utilities for handling i18n translations with JSONB storage
 * Provides safe fallback to default content when translations are missing
 */

/**
 * Get translated content with fallback to default
 * 
 * @param defaultContent - The default content (fallback)
 * @param translations - JSONB object with translations (locale as key)
 * @param locale - Current locale (null means use default content)
 * @returns Translated content or default content
 * 
 * @example
 * ```ts
 * const title = getTranslatedContent(
 *   'Welcome',
 *   { es: 'Bienvenido', fr: 'Bienvenue' },
 *   'es'
 * ); // Returns 'Bienvenido'
 * ```
 */
export function getTranslatedContent(
  defaultContent: string,
  translations?: Record<string, string> | null,
  locale?: string | null
): string {
  // Ensure defaultContent is a string
  const safeDefaultContent = defaultContent || '';
  
  // If no locale, return default content
  if (!locale) {
    return safeDefaultContent;
  }

  // If no translations object exists, return default content
  if (!translations || typeof translations !== 'object') {
    return safeDefaultContent;
  }

  // Try to get translation for the current locale
  const translatedContent = translations[locale];
  
  // If translation exists and is not empty, use it
  if (translatedContent && typeof translatedContent === 'string' && translatedContent.trim() !== '') {
    return translatedContent;
  }

  // If no translation for current locale, return the original default content
  return safeDefaultContent;
}

/**
 * Check if translation exists for a locale
 * @param translations - JSONB translations object
 * @param locale - Locale to check
 * @returns true if translation exists and is not empty
 */
export function hasTranslation(
  translations?: Record<string, string> | null,
  locale?: string | null
): boolean {
  if (!locale || !translations || typeof translations !== 'object') {
    return false;
  }
  
  const content = translations[locale];
  return !!(content && typeof content === 'string' && content.trim() !== '');
}

/**
 * Get all available locales from translations object
 * @param translations - JSONB translations object
 * @returns Array of locale codes
 */
export function getAvailableLocales(translations?: Record<string, string> | null): string[] {
  if (!translations || typeof translations !== 'object') {
    return [];
  }
  
  return Object.keys(translations).filter(locale => {
    const content = translations[locale];
    return content && typeof content === 'string' && content.trim() !== '';
  });
}

/**
 * Supported locales in the application
 */
export const SUPPORTED_LOCALES = [
  'en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'
] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Extract locale from pathname
 * @param pathname - Current pathname
 * @returns Locale code or null if default
 */
export function extractLocaleFromPathname(pathname: string): string | null {
  const pathSegments = pathname.split('/').filter(Boolean);
  const pathLocale = pathSegments[0];
  
  if (pathLocale && pathLocale.length === 2 && SUPPORTED_LOCALES.includes(pathLocale as SupportedLocale)) {
    return pathLocale;
  }
  
  return null;
}
