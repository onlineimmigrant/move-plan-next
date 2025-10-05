import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { helpCenterTranslations, type HelpCenterLocale, type HelpCenterTranslationKey } from './translations';

export function useHelpCenterTranslations() {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/help-center -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && helpCenterTranslations[pathLocale as HelpCenterLocale]) 
    ? pathLocale as HelpCenterLocale
    : (helpCenterTranslations[defaultLanguage as HelpCenterLocale] ? defaultLanguage as HelpCenterLocale : 'en');
  
  // Get translations for current locale
  const translations = helpCenterTranslations[currentLocale] || helpCenterTranslations.en;
  
  return {
    locale: currentLocale,
    t: translations,
    
    // Helper function to get a specific translation key
    getTranslation: (key: HelpCenterTranslationKey) => translations[key],
    
    // Helper function to get translation with fallback
    getSafeTranslation: (key: HelpCenterTranslationKey, fallback?: string) => {
      return translations[key] || fallback || helpCenterTranslations.en[key] || key;
    },
    
    // Utility functions for common help center actions
    getPageTitles: () => ({
      helpCenter: translations.helpCenter,
      supportKnowledgeBase: translations.supportKnowledgeBase,
      howCanWeHelp: translations.howCanWeHelp,
      searchKnowledgeBase: translations.searchKnowledgeBase,
    }),
    
    // Navigation helpers
    getTabLabels: () => ({
      welcome: translations.welcome,
      welcomeDescription: translations.welcomeDescription,
      knowledgeBase: translations.knowledgeBase,
      knowledgeBaseDescription: translations.knowledgeBaseDescription,
      faqs: translations.faqs,
      faqsDescription: translations.faqsDescription,
      features: translations.features,
      featuresDescription: translations.featuresDescription,
      offerings: translations.offerings,
      offeringsDescription: translations.offeringsDescription,
      liveSupport: translations.liveSupport,
      liveSupportDescription: translations.liveSupportDescription,
      aiAssistant: translations.aiAssistant,
      aiAssistantDescription: translations.aiAssistantDescription,
    }),
    
    // Search and filter helpers
    getSearchLabels: () => ({
      searchForHelp: translations.searchForHelp,
      searchArticles: translations.searchArticles,
      searchFAQs: translations.searchFAQs,
      searchFeatures: translations.searchFeatures,
      searchOfferings: translations.searchOfferings,
      noResultsFound: translations.noResultsFound,
      loadingContent: translations.loadingContent,
      errorLoadingContent: translations.errorLoadingContent,
    }),
    
    // Quick action helpers
    getQuickActions: () => ({
      frequentlyAskedQuestions: translations.frequentlyAskedQuestions,
      findAnswersCommon: translations.findAnswersCommon,
      browseArticlesGuides: translations.browseArticlesGuides,
      chatSupportTeam: translations.chatSupportTeam,
      getHelpAI: translations.getHelpAI,
    }),
    
    // Article and content helpers
    getArticleLabels: () => ({
      popularArticles: translations.popularArticles,
      articles: translations.articles,
      minRead: translations.minRead,
      by: translations.by,
      backToArticles: translations.backToArticles,
      backToWelcome: translations.backToWelcome,
      general: translations.general,
      category: translations.category,
      readTime: translations.readTime,
      author: translations.author,
      publishedOn: translations.publishedOn,
      noArticlesFound: translations.noArticlesFound,
    }),
    
    // Category and filter helpers
    getCategoryLabels: () => ({
      all: translations.all,
      uncategorized: translations.uncategorized,
      general: translations.general,
    }),
    
    // FAQ helpers
    getFAQLabels: () => ({
      frequentlyAskedQuestionsLong: translations.frequentlyAskedQuestionsLong,
      noFAQsFound: translations.noFAQsFound,
    }),
    
    // Chat and conversation helpers
    getChatLabels: () => ({
      typeMessage: translations.typeMessage,
      send: translations.send,
      online: translations.online,
      offline: translations.offline,
      connecting: translations.connecting,
      messageHistory: translations.messageHistory,
      startConversation: translations.startConversation,
    }),
    
    // AI Assistant helpers
    getAILabels: () => ({
      aiChat: translations.aiChat,
      askQuestion: translations.askQuestion,
      thinking: translations.thinking,
      loginRequired: translations.loginRequired,
      pleaseLogin: translations.pleaseLogin,
      login: translations.login,
      signup: translations.signup,
    }),
    
    // Common action helpers
    getActionLabels: () => ({
      back: translations.back,
      close: translations.close,
      expand: translations.expand,
      collapse: translations.collapse,
      viewMore: translations.viewMore,
      viewLess: translations.viewLess,
      retry: translations.retry,
      refresh: translations.refresh,
    }),
    
    // Status message helpers
    getStatusLabels: () => ({
      loading: translations.loading,
      error: translations.error,
      success: translations.success,
      noContent: translations.noContent,
      noContentDescription: translations.noContentDescription,
    }),
    
    // Support-specific helpers
    getSupportLabels: () => ({
      needMoreHelp: translations.needMoreHelp,
      supportCenter: translations.supportCenter,
      contactSupport: translations.contactSupport,
    }),
    
    // Accessibility helpers
    getAccessibilityLabels: () => ({
      toggleMenu: translations.toggleMenu,
      openInNewTab: translations.openInNewTab,
      closeDialog: translations.closeDialog,
      scrollToTop: translations.scrollToTop,
    }),
    
    // Utility function to format read time
    formatReadTime: (minutes: number) => `${minutes} ${translations.minRead}`,
    
    // Utility function to format author
    formatAuthor: (author: string) => `${translations.by} ${author}`,
    
    // Utility function to format category with fallback
    formatCategory: (category?: string) => category || translations.general,
    
    // Check if current locale is supported
    isLocaleSupported: () => currentLocale in helpCenterTranslations,
    
    // Get available locales
    getAvailableLocales: () => Object.keys(helpCenterTranslations) as HelpCenterLocale[],
  };
}

// Type export for component usage
export type HelpCenterTranslations = ReturnType<typeof useHelpCenterTranslations>;
