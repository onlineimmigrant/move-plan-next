'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useGeolocationLanguage } from '@/hooks/useLanguage';
import { useSettings } from '@/context/SettingsContext';
import { getSupportedLocales } from '@/lib/language-utils';

interface LanguageSuggestionBannerProps {
  currentLocale: string;
}

/**
 * Banner component that suggests language changes based on geolocation
 * Integrates with existing language switchers - doesn't replace them
 */
export default function LanguageSuggestionBanner({ currentLocale }: LanguageSuggestionBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useSettings();
  const [isDismissed, setIsDismissed] = useState(false);
  
  const {
    shouldSuggest,
    suggestedLanguage,
    languageName,
    dismissSuggestion
  } = useGeolocationLanguage(currentLocale);

  // Check if suggestion was previously dismissed
  useEffect(() => {
    const dismissed = document.cookie.includes('languageSuggestionDismissed=true');
    setIsDismissed(dismissed);
  }, []);

  // Don't show if dismissed, no suggestion, or not supported
  if (isDismissed || !shouldSuggest || !suggestedLanguage) {
    return null;
  }

  // Validate that suggested language is supported
  const supportedLocales = getSupportedLocales(settings as any);
  if (!supportedLocales.includes(suggestedLanguage)) {
    return null;
  }

  const handleAcceptSuggestion = () => {
    // Calculate the path without current locale
    const segments = pathname.split('/');
    const hasLocalePrefix = supportedLocales.includes(segments[1]);
    const pathWithoutLocale = hasLocalePrefix ? segments.slice(2).join('/') : segments.slice(1).join('/');
    
    // Get default language from settings
    const defaultLanguage = settings?.language || 'en';
    
    // Navigate to suggested language
    let newPath: string;
    if (suggestedLanguage === defaultLanguage) {
      // Default language doesn't use a prefix
      newPath = pathWithoutLocale ? `/${pathWithoutLocale}` : '/';
    } else {
      // Other languages use locale prefix
      newPath = pathWithoutLocale ? `/${suggestedLanguage}/${pathWithoutLocale}` : `/${suggestedLanguage}`;
    }
    
    router.push(newPath);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    dismissSuggestion();
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3s-4.5 4.03-4.5 9 2.015 9 4.5 9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5h-9M12 3v18" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                Based on your location, would you prefer to view this site in{' '}
                <span className="font-semibold text-blue-600">{languageName}</span>?
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAcceptSuggestion}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Switch to {languageName}
            </button>
            
            <button
              onClick={handleDismiss}
              className="inline-flex items-center p-2 border border-transparent rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              aria-label="Dismiss language suggestion"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}