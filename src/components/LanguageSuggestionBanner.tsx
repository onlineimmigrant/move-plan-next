'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { XMarkIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import { getSupportedLocales } from '@/lib/language-utils';

interface LanguageSuggestionBannerProps {
  currentLocale: string;
}

// Messages asking if user wants to stay in detected language or switch to default
// These messages are shown in the DETECTED language asking if they want to stay
const BANNER_MESSAGES = {
  'en': {
    message: 'We switched you to English based on your location. Is this correct?',
    switchButton: 'Switch to English', // This won't be used much since English is usually default
    dismissButton: 'Yes, continue in English'
  },
  'es': {
    message: 'Te hemos cambiado al español según tu ubicación. ¿Es correcto?',
    switchButton: 'Cambiar al inglés', 
    dismissButton: 'Sí, continuar en español'
  },
  'fr': {
    message: 'Nous vous avons basculé en français selon votre localisation. Est-ce correct?',
    switchButton: 'Changer vers l\'anglais',
    dismissButton: 'Oui, continuer en français'
  },
  'de': {
    message: 'Wir haben Sie aufgrund Ihres Standorts auf Deutsch umgestellt. Ist das richtig?',
    switchButton: 'Zu Englisch wechseln',
    dismissButton: 'Ja, auf Deutsch fortfahren'
  },
  'ru': {
    message: 'Мы переключили вас на русский язык на основе вашего местоположения. Это правильно?',
    switchButton: 'Переключить на английский',
    dismissButton: 'Да, продолжить на русском'
  },
  'it': {
    message: 'Ti abbiamo cambiato in italiano in base alla tua posizione. È corretto?',
    switchButton: 'Passa all\'inglese',
    dismissButton: 'Sì, continua in italiano'
  },
  'pt': {
    message: 'Mudamos para português com base na sua localização. Está correto?',
    switchButton: 'Mudar para inglês',
    dismissButton: 'Sim, continuar em português'
  },
  'zh': {
    message: '我们根据您的位置将您切换到中文。这样对吗？',
    switchButton: '切换到英文',
    dismissButton: '是的，继续使用中文'
  },
  'ja': {
    message: 'お客様の位置情報に基づいて日本語に切り替えました。これでよろしいですか？',
    switchButton: '英語に切り替える',
    dismissButton: 'はい、日本語で続ける'
  },
  'pl': {
    message: 'Przełączyliśmy Cię na język polski na podstawie Twojej lokalizacji. Czy to właściwe?',
    switchButton: 'Przełącz na angielski',
    dismissButton: 'Tak, kontynuuj w języku polskim'
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

  // Check for banner display cookies with 2-second delay
  useEffect(() => {
    const checkBannerCookies = () => {
      const shouldShow = document.cookie.includes('showLanguageBanner=true');
      const source = document.cookie.split(';')
        .find(c => c.trim().startsWith('bannerSourceLanguage='))
        ?.split('=')[1];
      const target = document.cookie.split(';')
        .find(c => c.trim().startsWith('bannerTargetLanguage='))
        ?.split('=')[1];
      const userChoice = localStorage.getItem('userLanguageChoice');

      // Don't show if user has already made a choice in this session
      if (shouldShow && source && target && !userChoice) {
        setShowBanner(true);
        setSourceLanguage(source);
        setTargetLanguage(target);
      }
    };

    // 2-second delay before showing banner
    const timer = setTimeout(checkBannerCookies, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Don't show if no banner data
  if (!showBanner || !sourceLanguage || !targetLanguage) {
    return null;
  }

  // Get messages in the detected (target) language - the language user was redirected to
  const messages = BANNER_MESSAGES[targetLanguage as keyof typeof BANNER_MESSAGES] || BANNER_MESSAGES['en'];

  const handleSwitchToDefault = () => {
    // Switch to default language (sourceLanguage)
    const supportedLocales = getSupportedLocales(settings as any);
    const segments = pathname.split('/');
    const hasLocalePrefix = supportedLocales.includes(segments[1]);
    const pathWithoutLocale = hasLocalePrefix ? segments.slice(2).join('/') : segments.slice(1).join('/');
    
    // Get default language from settings
    const defaultLanguage = settings?.language || 'en';
    
    // Navigate to default language (sourceLanguage)
    let newPath: string;
    if (sourceLanguage === defaultLanguage) {
      // Default language doesn't use a prefix
      newPath = pathWithoutLocale ? `/${pathWithoutLocale}` : '/';
    } else {
      // Other languages use locale prefix
      newPath = pathWithoutLocale ? `/${sourceLanguage}/${pathWithoutLocale}` : `/${sourceLanguage}`;
    }
    
    // Remember user's choice and mark as seen
    localStorage.setItem('userLanguageChoice', sourceLanguage);
    document.cookie = `userLanguageChoice=${sourceLanguage}; path=/; max-age=31536000`; // 1 year
    document.cookie = 'languageBannerSeen=true; path=/; max-age=31536000'; // 1 year
    setShowBanner(false);
    router.push(newPath);
  };

  const handleStayInCurrent = () => {
    // Stay in current detected language (targetLanguage)
    localStorage.setItem('userLanguageChoice', targetLanguage);
    document.cookie = `userLanguageChoice=${targetLanguage}; path=/; max-age=31536000`; // 1 year
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
                onClick={handleStayInCurrent}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                {messages.dismissButton}
              </button>
              
              <button
                onClick={handleSwitchToDefault}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-white/40 hover:bg-white/60 text-gray-700 font-medium rounded-2xl backdrop-blur-sm border border-white/30 hover:border-white/50 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              >
                {messages.switchButton}
              </button>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleStayInCurrent}
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