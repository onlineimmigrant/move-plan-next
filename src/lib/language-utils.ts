/**
 * Language to locale mapping for different countries
 * Maps language codes to their main country locales
 */
export const LANGUAGE_LOCALE_MAP: Record<string, string> = {
  'en': 'en_GB',  // English -> United Kingdom
  'es': 'es_ES',  // Spanish -> Spain
  'fr': 'fr_FR',  // French -> France
  'de': 'de_DE',  // German -> Germany
  'it': 'it_IT',  // Italian -> Italy
  'pt': 'pt_PT',  // Portuguese -> Portugal
  'ru': 'ru_RU',  // Russian -> Russia
  'zh': 'zh_CN',  // Chinese -> China
  'ja': 'ja_JP',  // Japanese -> Japan
  'ko': 'ko_KR',  // Korean -> South Korea
  'ar': 'ar_SA',  // Arabic -> Saudi Arabia
  'hi': 'hi_IN',  // Hindi -> India
  'pl': 'pl_PL',  // Polish -> Poland
  'nl': 'nl_NL',  // Dutch -> Netherlands
  'sv': 'sv_SE',  // Swedish -> Sweden
  'da': 'da_DK',  // Danish -> Denmark
  'no': 'no_NO',  // Norwegian -> Norway
  'fi': 'fi_FI',  // Finnish -> Finland
  'tr': 'tr_TR',  // Turkish -> Turkey
  'uk': 'uk_UA',  // Ukrainian -> Ukraine
};

/**
 * Default supported locales for next-intl (fallback)
 * Should match the message files in /messages directory
 */
export const DEFAULT_SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'ru', 'it', 'pt', 'zh', 'ja', 'pl'] as const;

/**
 * All available locales from LANGUAGE_LOCALE_MAP
 */
export const ALL_AVAILABLE_LOCALES: readonly string[] = Object.keys(LANGUAGE_LOCALE_MAP);

export type Locale = string;
export type DefaultLocale = typeof DEFAULT_SUPPORTED_LOCALES[number];

/**
 * Get supported locales from settings with fallback to default
 * @param settings - Settings object containing supported_locales
 * @returns Array of supported locale codes
 */
export function getSupportedLocales(settings?: { supported_locales?: string[] | null }): string[] {
  if (settings?.supported_locales && Array.isArray(settings.supported_locales) && settings.supported_locales.length > 0) {
    // Validate that all locales exist in LANGUAGE_LOCALE_MAP
    const validLocales = settings.supported_locales.filter(locale => 
      ALL_AVAILABLE_LOCALES.includes(locale)
    );
    return validLocales.length > 0 ? validLocales : [...DEFAULT_SUPPORTED_LOCALES];
  }
  return [...DEFAULT_SUPPORTED_LOCALES];
}

/**
 * Default locale for the application
 */
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Get locale from language code
 * @param language - Language code (e.g., 'en', 'es', 'fr')
 * @returns Locale string (e.g., 'en_GB', 'es_ES', 'fr_FR')
 */
export function getLocaleFromLanguage(language: string): string {
  return LANGUAGE_LOCALE_MAP[language.toLowerCase()] || 'en_GB';
}

/**
 * Get language code from locale
 * @param locale - Locale string (e.g., 'en_GB', 'es_ES')
 * @returns Language code (e.g., 'en', 'es')
 */
export function getLanguageFromLocale(locale: string): string {
  return locale.split('_')[0] || 'en';
}

/**
 * Check if a language is supported by next-intl
 * @param language - Language code to check
 * @param settings - Settings object containing supported_locales
 * @returns Boolean indicating if language is supported
 */
export function isSupportedLanguage(language: string, settings?: { supported_locales?: string[] }): boolean {
  const supportedLocales = getSupportedLocales(settings);
  return supportedLocales.includes(language);
}

/**
 * Get available languages list for next-intl
 * @param settings - Settings object containing supported_locales
 * @returns Array of supported language codes
 */
export function getAvailableLanguages(settings?: { supported_locales?: string[] }): string[] {
  return getSupportedLocales(settings);
}

/**
 * Get valid locale from language, with fallback to default
 * @param language - Language code to validate
 * @param settings - Settings object containing supported_locales
 * @returns Valid locale or default locale
 */
export function getValidLocale(language: string, settings?: { supported_locales?: string[] }): Locale {
  return isSupportedLanguage(language, settings) ? language : DEFAULT_LOCALE;
}

/**
 * Get locale from settings with validation for next-intl
 * @param settings - Settings object containing language preference and supported_locales
 * @returns Valid locale for next-intl
 */
export function getLocaleFromSettings(settings: { language?: string; supported_locales?: string[] }): Locale {
  const language = settings.language || DEFAULT_LOCALE;
  return getValidLocale(language, settings);
}

/**
 * Get language display name
 * @param locale - Locale code
 * @returns Human readable language name
 */
export function getLanguageDisplayName(locale: string): string {
  const names: Record<string, string> = {
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'zh': '中文',
    'ja': '日本語',
    'ko': '한국어',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'pl': 'Polski',
    'nl': 'Nederlands',
    'sv': 'Svenska',
    'da': 'Dansk',
    'no': 'Norsk',
    'fi': 'Suomi',
    'tr': 'Türkçe',
    'uk': 'Українська',
  };
  return names[locale] || names[DEFAULT_LOCALE];
}
