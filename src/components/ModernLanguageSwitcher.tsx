'use client';

import { Fragment } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { LANGUAGE_LOCALE_MAP, getSupportedLocales, type Locale } from '@/lib/language-utils';
import { useSettings } from '@/context/SettingsContext';

export default function ModernLanguageSwitcher() {
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
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center items-center gap-x-2 rounded-lg bg-transparent hover:bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-md hover:shadow-lg  focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white transition-all duration-300 ease-in-out group">
          <span className="text-sm font-bold tracking-wide">{currentLocale.toUpperCase()}</span>
          <ChevronDownIcon className="-mr-1 h-4 w-4 text-gray-500 group-hover:text-sky-600 transition-all duration-200 group-hover:rotate-180" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95 translate-y-1"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 translate-y-1"
      >
        <Menu.Items className="absolute right-0 z-20 mt-3 w-52 origin-top-right rounded-xl bg-gray-50 shadow-2xl ring-2 ring-sky-300 ring-opacity-10 focus:outline-none backdrop-blur-sm">
          <div className="py-2">
            {supportedLocales.map((locale: string) => (
              <Menu.Item key={locale}>
                {({ active }) => (
                  <button
                    onClick={() => handleLanguageChange(locale)}
                    className={`${
                      active ? 'bg-gradient-to-r from-sky-50 to-blue-50 text-sky-800' : 'text-gray-700'
                    } ${
                      locale === currentLocale ? 'bg-gradient-to-r from-sky-100 to-blue-100 text-sky-800 font-semibold shadow-sm' : ''
                    } group flex items-center w-full px-4 py-3 text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-sm`}
                  >
                    <span className="mr-3 text-xs font-bold text-gray-600 w-8 text-center bg-gray-100 rounded-md px-1.5 py-0.5">
                      {locale.toUpperCase()}
                    </span>
                    <span className="flex-1 text-left font-medium">
                      {getLanguageName(locale)}
                    </span>
                    {locale === currentLocale && (
                      <span className="ml-2 flex items-center">
                        <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                      </span>
                    )}
                    {locale === defaultLanguage && (
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">(Default)</span>
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
