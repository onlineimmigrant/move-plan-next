import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { feedbackTranslations } from './translations';

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ru' | 'it' | 'pt' | 'pl' | 'zh' | 'ja';

export function useFeedbackTranslations() {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/products -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && feedbackTranslations[pathLocale as Locale]) 
    ? pathLocale as Locale
    : (feedbackTranslations[defaultLanguage as Locale] ? defaultLanguage as Locale : 'en');
  
  // Get translations for current locale
  const translations = feedbackTranslations[currentLocale] || feedbackTranslations.en;
  
  return {
    locale: currentLocale,
    t: translations,
    
    // Helper function to get a specific translation key
    getTranslation: (key: keyof typeof translations) => translations[key],
    
    // Helper function to get translation with fallback
    getSafeTranslation: (key: keyof typeof translations, fallback?: string) => {
      return translations[key] || fallback || feedbackTranslations.en[key] || key;
    },
    
    // Main header helpers
    getCustomerReviewsLabel: () => translations.customerReviews,
    getReviewsLabel: (count: number) => count === 1 ? translations.review : translations.reviews,
    
    // Action helpers
    getWriteReviewLabel: () => translations.writeReview,
    getLoadMoreLabel: () => translations.loadMore,
    getLoadingLabel: () => translations.loading,
    
    // Empty state helpers
    getNoReviewsYetLabel: () => translations.noReviewsYet,
    getBeTheFirstToReviewLabel: () => translations.beTheFirstToReview,
    
    // Product reference helpers
    getOrganizationReviewLabel: () => translations.organizationReview,
    
    // Error message helpers
    getFailedToLoadFeedbackMessage: () => translations.failedToLoadFeedback,
    
    // ARIA label helpers
    getOpenReviewFormModalLabel: () => translations.openReviewFormModal,
    getExpandCollapseReviewsLabel: () => translations.expandCollapseReviews,
    
    // Utility functions for formatting
    formatReviewCount: (count: number) => {
      const reviewLabel = count === 1 ? translations.review : translations.reviews;
      return `${count} ${reviewLabel}`;
    },
    
    // Helper for dynamic content
    getReviewCountText: (totalCount: number) => {
      return `${totalCount} ${totalCount === 1 ? translations.review : translations.reviews}`;
    }
  };
}
