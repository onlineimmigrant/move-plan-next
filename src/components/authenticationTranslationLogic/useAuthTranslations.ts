import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { AUTH_TRANSLATIONS } from './translations';

type Locale = 'en' | 'es' | 'fr' | 'de' | 'ru' | 'it' | 'pt' | 'pl' | 'zh' | 'ja';

export const useAuthTranslations = () => {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /es/login -> es)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && AUTH_TRANSLATIONS[pathLocale as Locale]) 
    ? pathLocale as Locale
    : (AUTH_TRANSLATIONS[defaultLanguage as Locale] ? defaultLanguage as Locale : 'en');
    
  const translations = AUTH_TRANSLATIONS[currentLocale];
  
  return {
    // Common
    email: translations.email,
    password: translations.password,
    username: translations.username,
    loading: translations.loading,
    error: translations.error,
    success: translations.success,
    contact: translations.contact,
    privacy: translations.privacy,
    terms: translations.terms,
    logo: translations.logo,
    
    // Login page
    loginTitle: translations.loginTitle,
    loginSubtitle: translations.loginSubtitle,
    loginButton: translations.loginButton,
    loginLoading: translations.loginLoading,
    rememberMe: translations.rememberMe,
    forgotPassword: translations.forgotPassword,
    passwordReset: translations.passwordReset,
    forgotPasswordQuestion: translations.forgotPasswordQuestion,
    noAccount: translations.noAccount,
    createAccount: translations.createAccount,
    backToLogin: translations.backToLogin,
    
    // Register page
    registerTitle: translations.registerTitle,
    registerSubtitle: translations.registerSubtitle,
    registerButton: translations.registerButton,
    registerLoading: translations.registerLoading,
    confirmPassword: translations.confirmPassword,
    haveAccount: translations.haveAccount,
    signIn: translations.signIn,
    
    // Register Free Trial page
    registerFreeTrialTitle: translations.registerFreeTrialTitle,
    registerFreeTrialSubtitle: translations.registerFreeTrialSubtitle,
    welcomeTitle: translations.welcomeTitle,
    freeTrialButton: translations.freeTrialButton,
    freeTrialLoading: translations.freeTrialLoading,
    
    // Reset Password page
    resetPasswordTitle: translations.resetPasswordTitle,
    resetPasswordSubtitle: translations.resetPasswordSubtitle,
    resetPasswordButton: translations.resetPasswordButton,
    resetPasswordLoading: translations.resetPasswordLoading,
    resetPasswordSuccess: translations.resetPasswordSuccess,
    resetPasswordInstructions: translations.resetPasswordInstructions,
    
    // Password visibility
    showPassword: translations.showPassword,
    hidePassword: translations.hidePassword,
    show: translations.show,
    hide: translations.hide,
    
    // Validation messages
    fillAllFields: translations.fillAllFields,
    passwordTooShort: translations.passwordTooShort,
    usernameTooShort: translations.usernameTooShort,
    passwordsDoNotMatch: translations.passwordsDoNotMatch,
    invalidEmail: translations.invalidEmail,
    
    // Success messages
    registrationSuccessful: translations.registrationSuccessful,
    loginSuccessful: translations.loginSuccessful,
    redirectingToProfile: translations.redirectingToProfile,
    redirectingToLogin: translations.redirectingToLogin,
    checkEmail: translations.checkEmail,
    
    // Error messages
    emailAlreadyExists: translations.emailAlreadyExists,
    invalidCredentials: translations.invalidCredentials,
    accountNotFound: translations.accountNotFound,
    serverError: translations.serverError,
    registrationFailed: translations.registrationFailed,
    loginFailed: translations.loginFailed,
    unexpectedError: translations.unexpectedError,
    
    // Dynamic string helpers
    registerWith: (siteName: string) => translations.registerWith(siteName),
    welcomeTo: (siteName: string) => translations.welcomeTo(siteName),
    loginTo: (siteName: string) => translations.loginTo(siteName),
    
    // Current locale
    locale: currentLocale,
  };
};
