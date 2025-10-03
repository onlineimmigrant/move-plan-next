'use client';

import { useState, useEffect } from 'react';

/**
 * Client-side language detection utility
 */
function detectClientSideLanguage(): string {
  if (typeof window === 'undefined') {
    return 'en'; // Server-side fallback
  }
  
  // Check for language preference in localStorage
  const storedLanguage = localStorage.getItem('preferredLanguage');
  if (storedLanguage) {
    return storedLanguage;
  }
  
  // Check browser language
  const browserLanguage = navigator.language || navigator.languages?.[0];
  if (browserLanguage) {
    // Extract language code (e.g., 'en' from 'en-US')
    const languageCode = browserLanguage.split('-')[0];
    return languageCode;
  }
  
  return 'en';
}

/**
 * Save user language preference
 */
function saveLanguagePreference(language: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferredLanguage', language);
    
    // Also set a cookie for server-side access
    document.cookie = `preferredLanguage=${language}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
  }
}

/**
 * Hook for managing user language preferences on the client side
 */
export function useLanguagePreference() {
  const [language, setLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect language preference on mount
    const detectedLanguage = detectClientSideLanguage();
    setLanguage(detectedLanguage);
    setIsLoading(false);
  }, []);

  const updateLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    saveLanguagePreference(newLanguage);
    
    // Optionally reload the page to apply the new language
    // You might want to use next-intl's useRouter for navigation instead
    if (typeof window !== 'undefined') {
      // Update the URL to include the new locale
      const currentPath = window.location.pathname;
      const newPath = `/${newLanguage}${currentPath.replace(/^\/[a-z]{2}(?=\/|$)/, '')}`;
      window.location.href = newPath;
    }
  };

  return {
    language,
    setLanguage: updateLanguage,
    isLoading
  };
}

/**
 * Hook to get the detected user language from server-side detection
 * This reads the language set by the middleware
 */
export function useDetectedLanguage() {
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  useEffect(() => {
    // Try to get the language from a meta tag or data attribute set by the server
    const languageMeta = document.querySelector('meta[name="user-language"]');
    if (languageMeta) {
      setDetectedLanguage(languageMeta.getAttribute('content'));
      return;
    }

    // Fallback to client-side detection
    const clientLanguage = detectClientSideLanguage();
    setDetectedLanguage(clientLanguage);
  }, []);

  return detectedLanguage;
}

/**
 * Hook to sync language changes across the application
 */
export function useLanguageSync() {
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<{ language: string }>) => {
      saveLanguagePreference(event.detail.language);
      // You can add additional logic here, like updating the UI
    };

    // Listen for custom language change events
    window.addEventListener('languagechange', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languagechange', handleLanguageChange as EventListener);
    };
  }, []);

  const broadcastLanguageChange = (language: string) => {
    // Dispatch a custom event to notify other parts of the app
    const event = new CustomEvent('languagechange', {
      detail: { language }
    });
    window.dispatchEvent(event);
  };

  return { broadcastLanguageChange };
}

/**
 * Hook for geolocation-based language detection and suggestions
 * Integrates with the existing language switcher system
 */
export function useGeolocationLanguage(currentLocale: string) {
  const [suggestion, setSuggestion] = useState<{
    shouldSuggest: boolean;
    suggestedLanguage?: string;
    languageName?: string;
  }>({ shouldSuggest: false });

  useEffect(() => {
    // Check for detected language cookie from middleware
    const cookies = document.cookie.split(';');
    const detectedCookie = cookies
      .find(c => c.trim().startsWith('detectedLanguage='))
      ?.split('=')[1];
    
    if (detectedCookie && detectedCookie !== currentLocale) {
      // Get language names mapping
      const languageNames: Record<string, string> = {
        'en': 'English',
        'es': 'Español', 
        'fr': 'Français',
        'de': 'Deutsch',
        'ru': 'Русский',
        'it': 'Italiano',
        'pt': 'Português',
        'zh': '中文',
        'ja': '日本語',
        'pl': 'Polski'
      };
      
      setSuggestion({
        shouldSuggest: true,
        suggestedLanguage: detectedCookie,
        languageName: languageNames[detectedCookie] || detectedCookie.toUpperCase()
      });
    }
  }, [currentLocale]);

  const dismissSuggestion = () => {
    setSuggestion({ shouldSuggest: false });
    // Set a cookie to remember the dismissal
    document.cookie = `languageSuggestionDismissed=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
  };

  return {
    ...suggestion,
    dismissSuggestion
  };
}