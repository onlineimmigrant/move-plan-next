import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { productTranslations } from './translations';

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ru' | 'it' | 'pt' | 'pl' | 'zh' | 'ja';

export function useProductTranslations() {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/products -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && productTranslations[pathLocale as Locale]) 
    ? pathLocale as Locale
    : (productTranslations[defaultLanguage as Locale] ? defaultLanguage as Locale : 'en');
  
  // Get translations for current locale
  const translations = productTranslations[currentLocale] || productTranslations.en;
  
  return {
    locale: currentLocale,
    t: translations,
    
    // Helper function to get a specific translation key
    getTranslation: (key: keyof typeof translations) => translations[key],
    
    // Helper function to get translation with fallback
    getSafeTranslation: (key: keyof typeof translations, fallback?: string) => {
      return translations[key] || fallback || productTranslations.en[key] || key;
    },
    
    // Utility functions for common product actions
    getQuantityLabel: () => translations.quantity,
    getRemoveLabel: () => translations.remove,
    getFromLabel: () => translations.from,
    getLoadMoreLabel: () => translations.loadMoreProducts,
    getSearchPlaceholder: () => translations.searchPlaceholder,
    getNoImageLabel: () => translations.noImage,
    getAddToCartLabel: () => translations.addToCart,
    
    // Product status helpers
    getPaymentStatus: (status: 'succeeded' | 'processing' | 'requires_action') => {
      switch (status) {
        case 'succeeded':
          return translations.paymentSucceeded;
        case 'processing':
          return translations.paymentProcessing;
        case 'requires_action':
          return translations.paymentRequiresAction;
        default:
          return translations.paymentProcessing;
      }
    },
    
    // Stock status helpers
    getStockStatus: (inStock: boolean) => {
      return inStock ? translations.inStock : translations.outOfStock;
    },
    
    // Cart quantity helpers
    getQuantityControls: () => ({
      increase: translations.increaseQuantity,
      decrease: translations.decreaseQuantity,
      remove: translations.removeFromCart
    }),
    
    // Admin action helpers
    getAdminActions: () => ({
      create: translations.createNewProduct,
      edit: translations.editProducts
    }),
    
    // Loading state helpers
    getLoadingStates: () => ({
      loading: translations.loading,
      processing: translations.processing,
      retry: translations.retry
    }),
    
    // Navigation helpers
    getNavigationLabels: () => ({
      back: translations.backToProducts,
      viewCart: translations.viewCart,
      continue: translations.continue
    }),
    
    // Error message helpers
    getErrorMessages: () => ({
      failedToLoad: translations.failedToLoad,
      errorLoadingProducts: translations.errorLoadingProducts,
      noProductsFound: translations.noProductsFound
    }),
    
    // Accessibility helpers
    getAccessibilityLabels: () => ({
      productImage: translations.productImage,
      closeNotification: translations.closeNotification,
      skipToPricingPlans: translations.skipToPricingPlans,
      expandFeatures: translations.expandFeatures,
      collapseFeatures: translations.collapseFeatures
    }),
    
    // Check if current locale is supported
    isLocaleSupported: () => currentLocale in productTranslations
  };
}

// Type export for component usage
export type ProductTranslations = ReturnType<typeof useProductTranslations>;
