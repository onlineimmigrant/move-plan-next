import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { LEGAL_NOTICE_TRANSLATIONS, type LegalNoticeTranslations, type SupportedLocale } from './translations';

/**
 * Hook to get legal notice translations based on current locale
 * Uses URL locale if available, falls back to app default, then English
 */
export function useLegalNoticeTranslations(): LegalNoticeTranslations {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/page -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && LEGAL_NOTICE_TRANSLATIONS[pathLocale as SupportedLocale]) 
    ? pathLocale 
    : defaultLanguage;
  
  // Get translations for current locale or fallback to English
  const translations = LEGAL_NOTICE_TRANSLATIONS[currentLocale as SupportedLocale] || LEGAL_NOTICE_TRANSLATIONS.en;
  
  return translations;
}
