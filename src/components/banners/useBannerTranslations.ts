import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { BANNER_TRANSLATIONS, type BannerTranslations, type SupportedBannerLocale } from './translations';

// Hook to get banner translations based on current locale
export function useBannerTranslations(): BannerTranslations {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/page -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && BANNER_TRANSLATIONS[pathLocale as SupportedBannerLocale]) 
    ? pathLocale as SupportedBannerLocale
    : (BANNER_TRANSLATIONS[defaultLanguage as SupportedBannerLocale] ? defaultLanguage as SupportedBannerLocale : 'en');
  
  // Get translations for current locale or fallback to English
  return BANNER_TRANSLATIONS[currentLocale] || BANNER_TRANSLATIONS.en;
}
