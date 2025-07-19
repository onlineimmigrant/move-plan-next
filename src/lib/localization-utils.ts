import { Settings } from '@/types/settings';
import { getLocaleFromLanguage, isSupportedLanguage } from './language-utils';

/**
 * Content localization utilities for the application
 */

/**
 * Get language-specific content based on settings
 * @param settings - Application settings containing language preference
 * @param content - Object with language keys and their content
 * @param fallback - Fallback content if language not found
 * @returns Localized content or fallback
 */
export function getLocalizedContent<T>(
  settings: Settings,
  content: Record<string, T>,
  fallback: T
): T {
  const language = settings.language || 'en';
  return content[language] || content['en'] || fallback;
}

/**
 * Format date according to locale from settings
 * @param settings - Application settings
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatLocalizedDate(
  settings: Settings,
  date: Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const locale = getLocaleFromLanguage(settings.language || 'en');
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Format number according to locale from settings
 * @param settings - Application settings
 * @param number - Number to format
 * @param options - Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export function formatLocalizedNumber(
  settings: Settings,
  number: number,
  options: Intl.NumberFormatOptions = {}
): string {
  const locale = getLocaleFromLanguage(settings.language || 'en');
  return new Intl.NumberFormat(locale, options).format(number);
}

/**
 * Format currency according to locale from settings
 * @param settings - Application settings
 * @param amount - Amount to format
 * @param currency - Currency code (e.g., 'USD', 'EUR', 'GBP')
 * @returns Formatted currency string
 */
export function formatLocalizedCurrency(
  settings: Settings,
  amount: number,
  currency: string = 'USD'
): string {
  const locale = getLocaleFromLanguage(settings.language || 'en');
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Get text direction for the current language
 * @param settings - Application settings
 * @returns 'rtl' for right-to-left languages, 'ltr' for left-to-right
 */
export function getTextDirection(settings: Settings): 'ltr' | 'rtl' {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const language = settings.language || 'en';
  return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
}

/**
 * Example usage for content management:
 * 
 * const welcomeMessages = {
 *   'en': 'Welcome to our application',
 *   'es': 'Bienvenido a nuestra aplicación',
 *   'fr': 'Bienvenue dans notre application',
 *   'de': 'Willkommen in unserer Anwendung'
 * };
 * 
 * const message = getLocalizedContent(settings, welcomeMessages, 'Welcome');
 */
