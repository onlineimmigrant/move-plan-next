/**
 * Utility function to get translated menu content
 * @param defaultContent - The default content (fallback)
 * @param translations - JSONB object with translations
 * @param locale - Current locale (null means use default content)
 * @returns Translated content or default content
 */
export const getTranslatedMenuContent = (
  defaultContent: string,
  translations?: Record<string, string>,
  locale?: string | null
): string => {
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
};

/**
 * Extract locale from pathname
 * @param pathname - Current pathname
 * @returns locale string or null
 */
export const getLocaleFromPathname = (pathname: string): string | null => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const pathLocale = pathSegments[0];
  const supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'nl', 'pl', 'ja', 'zh'];
  return pathLocale && pathLocale.length === 2 && supportedLocales.includes(pathLocale) ? pathLocale : null;
};
