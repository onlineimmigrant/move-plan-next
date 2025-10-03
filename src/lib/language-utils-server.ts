import { headers } from 'next/headers';
import { detectUserLanguage } from './language';
import { getSettings } from '@/lib/getSettings';

/**
 * Get settings for language detection
 */
async function getSettingsForLanguage() {
  try {
    // Get base URL from environment or construct it
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    return await getSettings(baseUrl);
  } catch (error) {
    console.error('Error fetching settings for language detection:', error);
    return null;
  }
}

/**
 * Detect user's preferred language on the server side
 * This function can be used in Server Components and API routes
 */
export async function detectServerSideLanguage(): Promise<string> {
  const headersList = headers();
  const settings = await getSettingsForLanguage();
  
  // Convert Settings to the expected type
  const langSettings = settings ? {
    supported_locales: settings.supported_locales || undefined
  } : undefined;
  
  return detectUserLanguage(headersList, langSettings);
}

/**
 * Get user language from headers set by middleware
 * This is the recommended way to get user language in most cases
 */
export function getUserLanguageFromHeaders(headersList: Headers): string {
  return headersList.get('x-user-language') || 'en';
}

/**
 * Client-side language detection utility
 * This can be used in Client Components
 */
export function detectClientSideLanguage(): string {
  if (typeof window === 'undefined') {
    return 'en'; // Server-side fallback
  }
  
  // Check for language preference in localStorage
  const storedLanguage = localStorage.getItem('preferredLanguage');
  if (storedLanguage) {
    return storedLanguage;
  }
  
  // Check browser language
  const browserLanguage = navigator.language || navigator.languages?.[0];
  if (browserLanguage) {
    // Extract language code (e.g., 'en' from 'en-US')
    const languageCode = browserLanguage.split('-')[0];
    return languageCode;
  }
  
  return 'en';
}

/**
 * Save user language preference
 */
export function saveLanguagePreference(language: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferredLanguage', language);
    
    // Also set a cookie for server-side access
    document.cookie = `preferredLanguage=${language}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
  }
}

/**
 * Get language preference from cookie
 */
export function getLanguageFromCookie(headersList: Headers): string | null {
  const cookieHeader = headersList.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const languageCookie = cookies.find(cookie => cookie.startsWith('preferredLanguage='));
  
  if (languageCookie) {
    return languageCookie.split('=')[1];
  }
  
  return null;
}