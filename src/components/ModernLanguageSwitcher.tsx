'use client';

import { Fragment } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { LANGUAGE_LOCALE_MAP, getSupportedLocales, type Locale } from '@/lib/language-utils';
import { useSettings } from '@/context/SettingsContext';

interface ModernLanguageSwitcherProps {
  zIndex?: number;
  onLanguageChange?: (locale: Locale) => void;
  preventNavigation?: boolean;
}

export default function ModernLanguageSwitcher({ 
  zIndex = 20, 
  onLanguageChange,
  preventNavigation = false 
}: ModernLanguageSwitcherProps) {
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
    if (preventNavigation && onLanguageChange) {
      // Use callback instead of navigation when in widget context
      onLanguageChange(newLocale);
      return;
    }
    
    // Calculate the path without locale
    const segments = pathname.split('/');
    const pathWithoutLocale = urlLocale ? segments.slice(2).join('/') : segments.slice(1).join('/');
    
    // Handle the database default locale differently - no prefix
    let newPath: string;
    if (newLocale === defaultLanguage) {
      // Default language doesn't use a prefix, go to root or path without locale prefix
      newPath = pathWithoutLocale ? `/${pathWithoutLocale}` : '/';
    } else {
      // Other languages use locale prefix
      newPath = pathWithoutLocale ? `/${newLocale}/${pathWithoutLocale}` : `/${newLocale}`;
    }
    
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
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="group relative overflow-hidden inline-flex w-full justify-center items-center gap-x-2.5 rounded-2xl bg-white/90 backdrop-blur-3xl hover:bg-white/95 px-5 py-3 text-[14px] font-medium text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-lg focus:outline-none transition-all duration-150 ease-out antialiased transform hover:scale-[1.01] active:scale-[0.98]"
          style={{
            backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          }}
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
          
          <span className="relative z-10 text-[13px] font-semibold tracking-[-0.01em] transition-all duration-300 group-hover:scale-[1.02]">{currentLocale.toUpperCase()}</span>
          <ChevronDownIcon className="relative z-10 -mr-1 h-4 w-4 text-gray-500 group-hover:text-gray-700 transition-all duration-150 ease-out group-hover:rotate-180" aria-hidden="true" />
          
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-400 ease-out"></div>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-300"
        enterFrom="transform opacity-0 scale-95 translate-y-2"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-200"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 translate-y-2"
      >
        <Menu.Items 
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-white/90 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] focus:outline-none overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
          style={{ 
            zIndex,
            backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
            WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
          }}
        >
          {/* Enhanced top highlight with gradient */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"></div>
          
          {/* Inner glow for premium depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="relative py-3">
            {supportedLocales.map((locale: string, index) => (
              <Menu.Item key={locale}>
                {({ active }) => (
                  <button
                    onClick={() => handleLanguageChange(locale)}
                    className={`${
                      active ? 'bg-gray-50/70 backdrop-blur-sm text-gray-900 shadow-sm' : 'text-gray-700'
                    } ${
                      locale === currentLocale ? 'bg-gray-100/80 text-gray-900 font-semibold shadow-inner' : ''
                    } group relative overflow-hidden flex items-center w-full px-5 py-3.5 mx-2 rounded-xl text-[14px] transition-all duration-150 ease-out hover:scale-[1.01] antialiased ${
                      index !== supportedLocales.length - 1 ? 'mb-1' : ''
                    }`}
                  >
                    {/* Hover shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-300 ease-out"></div>
                    
                    <span className="relative z-10 mr-4 text-[11px] font-bold text-gray-600 w-9 text-center bg-gray-100/90 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-sm">
                      {locale.toUpperCase()}
                    </span>
                    <span className="relative z-10 flex-1 text-left font-medium tracking-[-0.01em] transition-all duration-300 group-hover:scale-[1.01]">
                      {getLanguageName(locale)}
                    </span>
                    {locale === currentLocale && (
                      <span className="relative z-10 ml-3 flex items-center">
                        <div className="w-2.5 h-2.5 bg-gray-700 rounded-full shadow-sm animate-pulse"></div>
                      </span>
                    )}
                    {locale === defaultLanguage && (
                      <span className="relative z-10 ml-3 text-[10px] text-gray-500 bg-gray-100/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full font-semibold shadow-sm">(Default)</span>
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
          
          {/* Enhanced bottom accent with depth */}
          <div className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-black/6 to-transparent"></div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
