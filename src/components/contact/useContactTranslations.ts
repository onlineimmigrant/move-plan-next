import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { contactTranslations } from './translations';

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ru' | 'it' | 'pt' | 'pl' | 'zh' | 'ja';

export function useContactTranslations() {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/contact -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && contactTranslations[pathLocale as Locale]) 
    ? pathLocale as Locale
    : (contactTranslations[defaultLanguage as Locale] ? defaultLanguage as Locale : 'en');
  
  // Get translations for current locale
  const translations = contactTranslations[currentLocale] || contactTranslations.en;
  
  return {
    locale: currentLocale,
    t: translations,
    
    // Helper function to get a specific translation key
    getTranslation: (key: keyof typeof translations) => translations[key],
    
    // Helper function to get translation with fallback
    getSafeTranslation: (key: keyof typeof translations, fallback?: string) => {
      return translations[key] || fallback || contactTranslations.en[key] || key;
    },
    
    // Section header helpers
    getPersonalInformationLabel: () => translations.personalInformation,
    getContactPreferencesLabel: () => translations.contactPreferences,
    getSecurityVerificationLabel: () => translations.securityVerification,
    getResponseTimeMessage: () => translations.responseTime,
    
    // Character count helper
    getCharactersCountMessage: (count: number) => translations.charactersCount.replace('{count}', count.toString()),
    
    // Utility functions for common contact form actions
    getNameLabel: () => translations.name,
    getEmailLabel: () => translations.email,
    getPhoneLabel: () => translations.phone,
    getSubjectLabel: () => translations.subject,
    getMessageLabel: () => translations.message,
    getSubmitLabel: () => translations.submit,
    getSubmittingLabel: () => translations.submitting,
    getCancelLabel: () => translations.cancel,
    getCloseLabel: () => translations.close,
    
    // Form validation helpers
    getNameRequiredError: () => translations.nameRequired,
    getEmailRequiredError: () => translations.emailRequired,
    getEmailInvalidError: () => translations.emailInvalid,
    getPhoneRequiredError: () => translations.phoneRequired,
    getPhoneInvalidError: () => translations.phoneInvalid,
    getSubjectRequiredError: () => translations.subjectRequired,
    getMessageRequiredError: () => translations.messageRequired,
    getMessageMinLengthError: () => translations.messageMinLength,
    
    // Form placeholders
    getNamePlaceholder: () => translations.namePlaceholder,
    getEmailPlaceholder: () => translations.emailPlaceholder,
    getPhonePlaceholder: () => translations.phonePlaceholder,
    getSubjectPlaceholder: () => translations.subjectPlaceholder,
    getMessagePlaceholder: () => translations.messagePlaceholder,
    
    // Contact preference helpers
    getPreferredContactLabel: () => translations.preferredContact,
    getContactByEmailLabel: () => translations.contactByEmail,
    getContactByPhoneLabel: () => translations.contactByPhone,
    getContactByTelegramLabel: () => translations.contactByTelegram,
    getContactByWhatsappLabel: () => translations.contactByWhatsapp,
    
    // Scheduling helpers
    getSchedulingLabel: () => translations.scheduling,
    getPreferredTimeLabel: () => translations.preferredTime,
    getSelectDateLabel: () => translations.selectDate,
    getSelectTimeLabel: () => translations.selectTime,
    getAvailableAnytimeLabel: () => translations.availableAnytime,
    getSpecificDateTimeLabel: () => translations.specificDateTime,
    
    // Security helpers
    getSecurityCheckLabel: () => translations.securityCheck,
    getMathChallengeLabel: () => translations.mathChallenge,
    getMathChallengeQuestion: (num1: number, num2: number) => 
      translations.mathChallengeLabel.replace('{num1}', num1.toString()).replace('{num2}', num2.toString()),
    getMathChallengeHelp: () => translations.mathChallengeHelp,
    getMathAnswerPlaceholder: () => translations.mathAnswerPlaceholder,
    getMathAnswerIncorrectError: () => translations.mathAnswerIncorrect,
    
    // Success and error message helpers
    getSubmitSuccessMessage: () => translations.submitSuccess,
    getSubmitSuccessDetails: () => translations.submitSuccessDetails,
    getSubmitErrorMessage: () => translations.submitError,
    getSubmitErrorDetails: () => translations.submitErrorDetails,
    getFormErrorMessage: () => translations.formError,
    getNetworkErrorMessage: () => translations.networkError,
    
    // Loading state helpers
    getLoadingLabel: () => translations.loading,
    getSendingLabel: () => translations.sending,
    
    // Modal specific helpers
    getModalTitle: () => translations.modalTitle,
    getModalSubtitle: () => translations.modalSubtitle,
    getCloseModalLabel: () => translations.closeModal,
    
    // Contact information helpers
    getContactInfoLabel: () => translations.contactInfo,
    getBusinessHoursLabel: () => translations.businessHours,
    getMondayToFridayLabel: () => translations.mondayToFriday,
    getWeekendHoursLabel: () => translations.weekendHours,
    getTimezoneLabel: () => translations.timezone,
    
    // Business contact helpers
    getEmailUsLabel: () => translations.emailUs,
    getCallUsLabel: () => translations.callUs,
    getMessageUsLabel: () => translations.messageUs,
    
    // Social contact helpers
    getTelegramLabel: () => translations.telegram,
    getWhatsappLabel: () => translations.whatsapp,
    
    // Additional helpers
    getRequiredLabel: () => translations.required,
    getOptionalLabel: () => translations.optional,
    getCharactersLabel: () => translations.characters,
    getCharactersLeftLabel: () => translations.charactersLeft,
    getCharactersMinLabel: () => translations.charactersMin,
    
    // Page title helpers
    getContactUsTitle: () => translations.contactUs,
    getGetInTouchTitle: () => translations.getInTouch,
    getContactTitle: () => translations.contactTitle,
    
    // Try again helper
    getTryAgainLabel: () => translations.tryAgain,
  };
}

// Type export for the translations object
export type ContactTranslations = typeof contactTranslations.en;

// Helper function to check if a locale is supported
export function isContactLocaleSupported(locale: string): locale is Locale {
  return locale in contactTranslations;
}

// Helper function to get available locales
export function getAvailableContactLocales(): Locale[] {
  return Object.keys(contactTranslations) as Locale[];
}

// Helper function to get default locale
export function getDefaultContactLocale(): Locale {
  return 'en';
}
