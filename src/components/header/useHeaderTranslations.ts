import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { HEADER_TRANSLATIONS, type HeaderTranslations, type SupportedHeaderLocale } from './translations';

// Hook to get header translations based on current locale
export function useHeaderTranslations() {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/page -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && HEADER_TRANSLATIONS[pathLocale as SupportedHeaderLocale]) 
    ? pathLocale as SupportedHeaderLocale
    : (HEADER_TRANSLATIONS[defaultLanguage as SupportedHeaderLocale] ? defaultLanguage as SupportedHeaderLocale : 'en');
  
  // Get translations for current locale or fallback to English
  const translations = HEADER_TRANSLATIONS[currentLocale] || HEADER_TRANSLATIONS.en;
  
  return {
    ...translations,
    // Helper functions for dynamic strings
    viewBasket: (count: number) => translations.viewBasket.replace('{count}', count.toString()),
    openMenuFor: (name: string) => translations.openMenuFor.replace('{name}', name),
    goTo: (name: string) => translations.goTo.replace('{name}', name),
    toggleMenu: (name: string) => translations.toggleMenu.replace('{name}', name),
  };
}
