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
      <select 
        value={currentLocale}
        onChange={(e) => handleLanguageChange(e.target.value as Locale)}
        className="bg-neutral-800 border border-neutral-600 rounded-md px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 focus:ring-offset-neutral-900"
        aria-label="Select language"
      >
        {supportedLocales.map((locale: string) => (
          <option key={locale} value={locale} className="bg-neutral-800 text-neutral-300">
            {getLanguageName(locale)} {locale === defaultLanguage && '(Default)'}
          </option>
        ))}
      </select>
    </div>
  );
}
