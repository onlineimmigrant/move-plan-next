'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LANGUAGE_LOCALE_MAP, getSupportedLocales, type Locale } from '@/lib/language-utils';
import { useSettings } from '@/context/SettingsContext';

export function useLanguageUpdater() {
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
  
  // Update document language dynamically
  useEffect(() => {
    const language = LANGUAGE_LOCALE_MAP[currentLocale] || currentLocale;
    document.documentElement.lang = language;
  }, [currentLocale]);

  return {
    currentLocale,
    defaultLanguage,
    language: LANGUAGE_LOCALE_MAP[currentLocale] || currentLocale
  };
}
