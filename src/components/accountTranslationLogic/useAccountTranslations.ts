import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { ACCOUNT_TRANSLATIONS } from './translations';

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ru' | 'it' | 'pt' | 'pl' | 'zh' | 'ja';

export const useAccountTranslations = () => {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/account -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && ACCOUNT_TRANSLATIONS[pathLocale as Locale]) 
    ? pathLocale as Locale
    : (ACCOUNT_TRANSLATIONS[defaultLanguage as Locale] ? defaultLanguage as Locale : 'en');
  
  // Get translations for current locale
  const translations = ACCOUNT_TRANSLATIONS[currentLocale] || ACCOUNT_TRANSLATIONS.en;
  
  return {
    locale: currentLocale,
    t: translations,
  };
};
