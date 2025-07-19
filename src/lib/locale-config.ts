import { Locale } from './language-utils';

/**
 * This function determines the default language for the application.
 * It prioritizes: 1) Environment variable 2) Database setting (via API) 3) Fallback to 'en'
 */
export async function getDefaultLocaleAsync(): Promise<Locale> {
  // First check environment variable
  const envDefault = process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale;
  if (envDefault && ['en', 'es', 'fr', 'de', 'ru'].includes(envDefault)) {
    return envDefault;
  }

  // For server-side, try to get from database
  if (typeof window === 'undefined') {
    try {
      const { getSettings } = await import('./getSettings');
      const settings = await getSettings();
      if (settings.language && ['en', 'es', 'fr', 'de', 'ru'].includes(settings.language)) {
        return settings.language as Locale;
      }
    } catch (error) {
      console.warn('Could not fetch dynamic locale from database:', error);
    }
  }

  // Fallback to English
  return 'en';
}

/**
 * Synchronous version for middleware and edge cases
 * Uses environment variable or falls back to English
 */
export function getDefaultLocale(): Locale {
  const envDefault = process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale;
  
  if (envDefault && ['en', 'es', 'fr', 'de', 'ru'].includes(envDefault)) {
    return envDefault;
  }
  
  // Fallback to English for middleware
  return 'en';
}

/**
 * Check if a given locale is the default locale
 */
export function isDefaultLocale(locale: Locale): boolean {
  return locale === getDefaultLocale();
}
