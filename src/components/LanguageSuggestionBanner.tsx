'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { XMarkIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import { getSupportedLocales } from '@/lib/language-utils';

interface LanguageSuggestionBannerProps {
  currentLocale: string;
}

// Localized messages for the banner
const BANNER_MESSAGES = {
  'en': {
    message: 'Would you like to continue in English?',
    switchButton: 'Continue in English',
    dismissButton: 'Stay here'
  },
  'es': {
    message: '¿Te gustaría continuar en español?',
    switchButton: 'Continuar en español', 
    dismissButton: 'Quedarse aquí'
  },
  'fr': {
    message: 'Souhaitez-vous continuer en français?',
    switchButton: 'Continuer en français',
    dismissButton: 'Rester ici'
  },
  'de': {
    message: 'Möchten Sie auf Deutsch fortfahren?',
    switchButton: 'Auf Deutsch fortfahren',
    dismissButton: 'Hier bleiben'
  },
  'ru': {
    message: 'Хотите продолжить на русском языке?',
    switchButton: 'Продолжить на русском',
    dismissButton: 'Остаться здесь'
  },
  'it': {
    message: 'Vuoi continuare in italiano?',
    switchButton: 'Continua in italiano',
    dismissButton: 'Resta qui'
  },
  'pt': {
    message: 'Gostaria de continuar em português?',
    switchButton: 'Continuar em português',
    dismissButton: 'Ficar aqui'
  },
  'zh': {
    message: '您想继续使用中文吗？',
    switchButton: '继续使用中文',
    dismissButton: '留在这里'
  },
  'ja': {
    message: '日本語で続けますか？',
    switchButton: '日本語で続ける',
    dismissButton: 'ここに留まる'
  },
  'pl': {
    message: 'Czy chcesz kontynuować w języku polskim?',
    switchButton: 'Kontynuuj w języku polskim',
    dismissButton: 'Zostań tutaj'
  }
};

/**
 * Glassmorphism banner that appears when user's location suggests a different language
 * Shows message in detected language asking if they want to switch to default
 */
export default function LanguageSuggestionBanner({ currentLocale }: LanguageSuggestionBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useSettings();
  const [showBanner, setShowBanner] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');

  // Check for banner display cookies
  useEffect(() => {
    const shouldShow = document.cookie.includes('showLanguageBanner=true');
    const source = document.cookie.split(';')
      .find(c => c.trim().startsWith('bannerSourceLanguage='))
      ?.split('=')[1];
    const target = document.cookie.split(';')
      .find(c => c.trim().startsWith('bannerTargetLanguage='))
      ?.split('=')[1];

    if (shouldShow && source && target) {
      setShowBanner(true);
      setSourceLanguage(source);
      setTargetLanguage(target);
    }
  }, []);

  // Don't show if no banner data
  if (!showBanner || !sourceLanguage || !targetLanguage) {
    return null;
  }

  // Get messages in the detected (source) language
  const messages = BANNER_MESSAGES[sourceLanguage as keyof typeof BANNER_MESSAGES] || BANNER_MESSAGES['en'];

  const handleAcceptSuggestion = () => {
    // Navigate to target language
    const supportedLocales = getSupportedLocales(settings as any);
    const segments = pathname.split('/');
    const hasLocalePrefix = supportedLocales.includes(segments[1]);
    const pathWithoutLocale = hasLocalePrefix ? segments.slice(2).join('/') : segments.slice(1).join('/');
    
    // Get default language from settings
    const defaultLanguage = settings?.language || 'en';
    
    // Navigate to target language
    let newPath: string;
    if (targetLanguage === defaultLanguage) {
      // Default language doesn't use a prefix
      newPath = pathWithoutLocale ? `/${pathWithoutLocale}` : '/';
    } else {
      // Other languages use locale prefix
      newPath = pathWithoutLocale ? `/${targetLanguage}/${pathWithoutLocale}` : `/${targetLanguage}`;
    }
    
    // Mark as seen and dismiss
    document.cookie = 'languageBannerSeen=true; path=/; max-age=31536000'; // 1 year
    setShowBanner(false);
    router.push(newPath);
  };

  const handleDismiss = () => {
    // Mark as dismissed and hide
    document.cookie = 'languageBannerDismissed=true; path=/; max-age=604800'; // 7 days
    document.cookie = 'languageBannerSeen=true; path=/; max-age=31536000'; // 1 year
    setShowBanner(false);
  };

  return (
    <>
      {/* Glassmorphism Overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Banner Card */}
        <div className="relative w-full max-w-sm md:max-w-md lg:w-1/4 bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 duration-300">
          {/* Glassmorphism effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-sky-500/10 via-transparent to-purple-500/10 rounded-3xl"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Header with icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-sky-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm">
                <GlobeAltIcon className="h-6 w-6 text-sky-600" />
              </div>
            </div>
            
            {/* Message */}
            <div className="text-center mb-6">
              <p className="text-gray-800 font-medium leading-relaxed">
                {messages.message}
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleAcceptSuggestion}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                {messages.switchButton}
              </button>
              
              <button
                onClick={handleDismiss}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-white/40 hover:bg-white/60 text-gray-700 font-medium rounded-2xl backdrop-blur-sm border border-white/30 hover:border-white/50 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              >
                {messages.dismissButton}
              </button>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/30 hover:bg-white/50 text-gray-600 hover:text-gray-800 backdrop-blur-sm transition-all duration-200"
            aria-label="Close"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}