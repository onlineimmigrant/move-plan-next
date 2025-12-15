import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { FOOTER_TRANSLATIONS, FooterTranslations } from './footerTranslations';

/**
 * Hook to get footer translations based on current locale
 * Extracts locale from pathname and provides fallback to default language
 */
export function useFooterTranslations() {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/page -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && FOOTER_TRANSLATIONS[pathLocale as keyof typeof FOOTER_TRANSLATIONS]) 
    ? pathLocale 
    : defaultLanguage;
  
  // Get translations for current locale or fallback to English
  const translations = FOOTER_TRANSLATIONS[currentLocale as keyof typeof FOOTER_TRANSLATIONS] || FOOTER_TRANSLATIONS.en;
  
  return {
    allRightsReserved: translations.allRightsReserved,
    language: translations.language,
    privacySettings: translations.privacySettings,
    legalNotice: translations.legalNotice,
    profile: translations.profile,
    admin: translations.admin,
    dashboard: translations.dashboard,
    tickets: translations.tickets,
    meetings: translations.meetings,
    aiAgents: translations.aiAgents,
    logout: translations.logout,
    login: translations.login,
    register: translations.register,
    links: translations.links,
    quickLinks: translations.quickLinks,
    hasTranslations: true
  };
}
