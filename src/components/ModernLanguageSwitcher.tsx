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
  openUpward?: boolean;
  variant?: 'light' | 'dark';
}

export default function ModernLanguageSwitcher({ 
  zIndex = 20, 
  onLanguageChange,
  preventNavigation = false,
  openUpward = false,
  variant = 'light'
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
        <Menu.Button 
          className={`group relative inline-flex w-full justify-center items-center gap-x-2 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none transition-colors duration-150 ${
            variant === 'dark' 
              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white' 
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <span className="text-sm font-medium">{currentLocale.toUpperCase()}</span>
          <ChevronDownIcon 
            className={`h-4 w-4 transition-all duration-150 group-hover:rotate-180 ${
              variant === 'dark' ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-500 group-hover:text-gray-700'
            }`} 
            aria-hidden="true" 
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items 
          className={`absolute right-0 ${openUpward ? 'bottom-full mb-2' : 'mt-2'} w-56 ${openUpward ? 'origin-bottom-right' : 'origin-top-right'} rounded-lg bg-white shadow-lg focus:outline-none`}
          style={{ zIndex }}
        >
          <div className="py-1">
            {supportedLocales.map((locale: string) => (
              <Menu.Item key={locale}>
                {({ active }) => (
                  <button
                    onClick={() => handleLanguageChange(locale)}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } ${
                      locale === currentLocale ? 'bg-gray-50 font-semibold' : ''
                    } flex items-center w-full px-4 py-2 text-sm transition-colors duration-150`}
                  >
                    <span className="mr-3 text-xs font-medium text-gray-500 w-8 text-center">
                      {locale.toUpperCase()}
                    </span>
                    <span className="flex-1 text-left">
                      {getLanguageName(locale)}
                    </span>
                    {locale === currentLocale && (
                      <span className="ml-2">
                        <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                      </span>
                    )}
                    {locale === defaultLanguage && (
                      <span className="ml-2 text-xs text-gray-400">(Default)</span>
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
