// Language detection based on geolocation
// Maps countries to preferred languages based on official languages and common usage

import { detectUserCurrency } from './currency';
import { getSupportedLocales } from './language-utils';

// Comprehensive country to language mapping
// Priority given to primary/official languages, with fallback to common second languages
const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  // English speaking countries
  'US': 'en', // United States
  'GB': 'en', // United Kingdom
  'CA': 'en', // Canada (English is more widely spoken globally)
  'AU': 'en', // Australia
  'NZ': 'en', // New Zealand
  'IE': 'en', // Ireland
  'ZA': 'en', // South Africa
  'IN': 'en', // India (English is widely used)
  'SG': 'en', // Singapore (English is official language)
  'HK': 'en', // Hong Kong (English is co-official)
  'MY': 'en', // Malaysia
  'PH': 'en', // Philippines
  'NG': 'en', // Nigeria
  'KE': 'en', // Kenya
  'GH': 'en', // Ghana
  'UG': 'en', // Uganda
  'TZ': 'en', // Tanzania
  'ZW': 'en', // Zimbabwe
  'BW': 'en', // Botswana
  'MT': 'en', // Malta
  'CY': 'en', // Cyprus
  'NL': 'en', // Netherlands - fallback to English for better support
  'BE': 'en', // Belgium - English is neutral choice
  'SR': 'en', // Suriname - fallback to English
  
  // Spanish speaking countries
  'ES': 'es', // Spain
  'MX': 'es', // Mexico
  'AR': 'es', // Argentina
  'CO': 'es', // Colombia
  'PE': 'es', // Peru
  'VE': 'es', // Venezuela
  'CL': 'es', // Chile
  'EC': 'es', // Ecuador
  'BO': 'es', // Bolivia
  'PY': 'es', // Paraguay
  'UY': 'es', // Uruguay
  'CR': 'es', // Costa Rica
  'PA': 'es', // Panama
  'NI': 'es', // Nicaragua
  'HN': 'es', // Honduras
  'SV': 'es', // El Salvador
  'GT': 'es', // Guatemala
  'CU': 'es', // Cuba
  'DO': 'es', // Dominican Republic
  'PR': 'es', // Puerto Rico
  'GQ': 'es', // Equatorial Guinea
  
  // French speaking countries
  'FR': 'fr', // France
  'LU': 'fr', // Luxembourg
  'MC': 'fr', // Monaco
  'SN': 'fr', // Senegal
  'CI': 'fr', // Ivory Coast
  'ML': 'fr', // Mali
  'BF': 'fr', // Burkina Faso
  'NE': 'fr', // Niger
  'TD': 'fr', // Chad
  'MG': 'fr', // Madagascar
  'CM': 'fr', // Cameroon
  'CG': 'fr', // Republic of Congo
  'CD': 'fr', // Democratic Republic of Congo
  'GA': 'fr', // Gabon
  'CF': 'fr', // Central African Republic
  'TG': 'fr', // Togo
  'BJ': 'fr', // Benin
  'RW': 'fr', // Rwanda
  'BI': 'fr', // Burundi
  'KM': 'fr', // Comoros
  'DJ': 'fr', // Djibouti
  'VU': 'fr', // Vanuatu
  'NC': 'fr', // New Caledonia
  'PF': 'fr', // French Polynesia
  
  // German speaking countries
  'DE': 'de', // Germany
  'AT': 'de', // Austria
  'CH': 'de', // Switzerland (German is most widely spoken)
  'LI': 'de', // Liechtenstein
  
  // Russian speaking countries
  'RU': 'ru', // Russia
  'BY': 'ru', // Belarus
  'KZ': 'ru', // Kazakhstan
  'KG': 'ru', // Kyrgyzstan
  'TJ': 'ru', // Tajikistan
  'UZ': 'ru', // Uzbekistan
  'TM': 'ru', // Turkmenistan
  'MD': 'ru', // Moldova
  'AM': 'ru', // Armenia
  'AZ': 'ru', // Azerbaijan
  'GE': 'ru', // Georgia
  
  // Italian speaking countries
  'IT': 'it', // Italy
  'SM': 'it', // San Marino
  'VA': 'it', // Vatican City
  
  // Portuguese speaking countries
  'PT': 'pt', // Portugal
  'BR': 'pt', // Brazil
  'AO': 'pt', // Angola
  'MZ': 'pt', // Mozambique
  'CV': 'pt', // Cape Verde
  'GW': 'pt', // Guinea-Bissau
  'ST': 'pt', // São Tomé and Príncipe
  'TL': 'pt', // East Timor
  'MO': 'pt', // Macau
  
  // Chinese speaking regions
  'CN': 'zh', // China
  'TW': 'zh', // Taiwan
  
  // Polish speaking countries
  'PL': 'pl', // Poland
  
  // Japanese speaking countries
  'JP': 'ja', // Japan
  
  // Nordic countries - fallback to English for better support
  'SE': 'en', // Sweden
  'NO': 'en', // Norway
  'DK': 'en', // Denmark
  'FI': 'en', // Finland
  'IS': 'en', // Iceland
  
  // Other European countries - fallback to English
  'GR': 'en', // Greece
  'CZ': 'en', // Czech Republic
  'SK': 'en', // Slovakia
  'HU': 'en', // Hungary
  'RO': 'en', // Romania
  'BG': 'en', // Bulgaria
  'HR': 'en', // Croatia
  'SI': 'en', // Slovenia
  'EE': 'en', // Estonia
  'LV': 'en', // Latvia
  'LT': 'en', // Lithuania
  
  // Middle East and other regions - fallback to English
  'TR': 'en', // Turkey
  'IL': 'en', // Israel
  'AE': 'en', // UAE
  'SA': 'en', // Saudi Arabia
  'EG': 'en', // Egypt
  'MA': 'en', // Morocco
  'DZ': 'en', // Algeria
  'TN': 'en', // Tunisia
  'JO': 'en', // Jordan
  'LB': 'en', // Lebanon
  'KW': 'en', // Kuwait
  'QA': 'en', // Qatar
  'BH': 'en', // Bahrain
  'OM': 'en', // Oman
  'IQ': 'en', // Iraq
  'IR': 'en', // Iran
  'AF': 'en', // Afghanistan
  'PK': 'en', // Pakistan
  'BD': 'en', // Bangladesh
  'LK': 'en', // Sri Lanka
  'MM': 'en', // Myanmar
  'TH': 'en', // Thailand
  'VN': 'en', // Vietnam
  'ID': 'en', // Indonesia
  'KR': 'en', // South Korea
  'KP': 'en', // North Korea
  'MN': 'en', // Mongolia
};

// Note: Use getSupportedLocales(settings) for dynamic language support
export const DEFAULT_SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ru', 'it', 'pt', 'zh', 'pl', 'ja'] as const;
export type SupportedLanguage = typeof DEFAULT_SUPPORTED_LANGUAGES[number];

/**
 * Get language code based on country code
 */
export function getLanguageByCountry(countryCode: string, fallbackLanguage: string = 'en'): string {
  if (!countryCode) return fallbackLanguage;
  
  const language = COUNTRY_LANGUAGE_MAP[countryCode.toUpperCase()];
  return language || fallbackLanguage;
}

/**
 * Detect user language from request headers (set by middleware)
 * @param headers - Request headers
 * @param settings - Settings object containing supported_locales
 */
export function detectUserLanguage(headers: Headers, settings?: { supported_locales?: string[] }): string {
  const supportedLocales = getSupportedLocales(settings);
  
  // Check for language header set by middleware
  const userLanguage = headers.get('x-user-language');
  if (userLanguage && supportedLocales.includes(userLanguage)) {
    return userLanguage;
  }
  
  // Check for country header and derive language
  const userCountry = headers.get('x-user-country');
  if (userCountry) {
    const derivedLanguage = getLanguageByCountry(userCountry);
    if (supportedLocales.includes(derivedLanguage)) {
      return derivedLanguage;
    }
  }
  
  // Fallback to English
  return 'en';
}

/**
 * Check if a language is supported
 * @param language - Language code to check
 * @param settings - Settings object containing supported_locales
 */
export function isSupportedLanguage(language: string, settings?: { supported_locales?: string[] }): boolean {
  const supportedLocales = getSupportedLocales(settings);
  return supportedLocales.includes(language);
}

/**
 * Get the best matching supported language from a list of preferred languages
 */
export function getBestSupportedLanguage(
  preferredLanguages: string[], 
  supportedLanguages: string[] = [...DEFAULT_SUPPORTED_LANGUAGES],
  fallback: string = 'en'
): string {
  for (const lang of preferredLanguages) {
    // Check exact match
    if (supportedLanguages.includes(lang)) {
      return lang;
    }
    
    // Check language without region (e.g., 'en' from 'en-US')
    const baseLang = lang.split('-')[0];
    if (supportedLanguages.includes(baseLang)) {
      return baseLang;
    }
  }
  
  return fallback;
}

/**
 * Parse Accept-Language header and get preferred languages
 */
export function parseAcceptLanguage(acceptLanguage: string): string[] {
  if (!acceptLanguage) return [];
  
  return acceptLanguage
    .split(',')
    .map(lang => {
      const [language, quality] = lang.trim().split(';q=');
      return {
        language: language.trim(),
        quality: quality ? parseFloat(quality) : 1.0
      };
    })
    .sort((a, b) => b.quality - a.quality)
    .map(item => item.language);
}

/**
 * Detect language based on multiple sources with priority
 * @param countryCode - Country code from geolocation
 * @param acceptLanguage - Accept-Language header
 * @param settings - Settings object containing supported_locales
 * @param fallback - Fallback language
 */
export function detectLanguageFromSources(
  countryCode?: string,
  acceptLanguage?: string,
  settings?: { supported_locales?: string[] },
  fallback: string = 'en'
): string {
  const supportedLanguages = getSupportedLocales(settings);
  
  // Priority 1: Country-based language
  if (countryCode) {
    const countryLanguage = getLanguageByCountry(countryCode, '');
    if (countryLanguage && supportedLanguages.includes(countryLanguage)) {
      return countryLanguage;
    }
  }
  
  // Priority 2: Accept-Language header
  if (acceptLanguage) {
    const preferredLanguages = parseAcceptLanguage(acceptLanguage);
    const browserLanguage = getBestSupportedLanguage(preferredLanguages, supportedLanguages, '');
    if (browserLanguage && supportedLanguages.includes(browserLanguage)) {
      return browserLanguage;
    }
  }
  
  // Priority 3: Fallback
  return fallback;
}