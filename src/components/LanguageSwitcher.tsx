'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LANGUAGE_LOCALE_MAP, getSupportedLocales, type Locale } from '@/lib/language-utils';
import { useSettings } from '@/context/SettingsContext';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Get default language from settings, fallback to 'en'
  const defaultLanguage = (settings?.language || 'en') as Locale;
  
  // Get supported locales from settings
  const supportedLocales = getSupportedLocales(settings as any);
  
  // Extract current locale from pathname
  const pathSegments = pathname.split('/');
  const urlLocale = supportedLocales.includes(pathSegments[1]) 
    ? pathSegments[1] as Locale
    : null;
  
  // Current locale: if URL has locale, use that; otherwise it's the database default (no prefix)
  const currentLocale = urlLocale || defaultLanguage;

  const handleLanguageChange = (newLocale: Locale) => {
    // Calculate the path without locale
    const segments = pathname.split('/');
    const pathWithoutLocale = urlLocale ? segments.slice(2).join('/') : segments.slice(1).join('/');
    
    // Always use the locale prefix approach - let middleware handle the rest
    const newPath = pathWithoutLocale ? `/${newLocale}/${pathWithoutLocale}` : `/${newLocale}`;
    router.push(newPath);
  };

  const getLanguageName = (locale: Locale) => {
    const languageNames: Record<Locale, string> = {
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
    return languageNames[locale] || locale.toUpperCase();
  };

  return (
    <div className="relative inline-block text-left">
      <div className="relative">
        <select 
          value={currentLocale}
          onChange={(e) => handleLanguageChange(e.target.value as Locale)}
          className="appearance-none bg-white/90 backdrop-blur-3xl border border-black/8 rounded-2xl px-4 py-2.5 pr-10 text-[13px] font-medium text-gray-700 hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm hover:shadow-md antialiased cursor-pointer"
          style={{
            backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          }}
          aria-label="Select language"
        >
          {supportedLocales.map((locale: string) => (
            <option key={locale} value={locale} className="bg-white text-gray-700 font-medium">
              {getLanguageName(locale)} {locale === defaultLanguage && '(Default)'}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg 
            className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
