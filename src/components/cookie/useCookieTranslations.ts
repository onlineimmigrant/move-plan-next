import { usePathname } from 'next/navigation';
import { useSettings } from '../../context/SettingsContext';
import { COOKIE_TRANSLATIONS, type CookieTranslations, type SupportedLocale } from './translations';

/**
 * Hook to get cookie translations based on current locale
 * Uses URL locale if available, falls back to app default, then English
 */
export function useCookieTranslations(): CookieTranslations {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/page -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && COOKIE_TRANSLATIONS[pathLocale as SupportedLocale]) 
    ? pathLocale 
    : defaultLanguage;
  
  // Get translations for current locale or fallback to English
  const translations = COOKIE_TRANSLATIONS[currentLocale as SupportedLocale] || COOKIE_TRANSLATIONS.en;
  
  return translations;
}
