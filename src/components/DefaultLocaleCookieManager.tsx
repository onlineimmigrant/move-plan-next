"use client";

import { useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

/**
 * This component sets a cookie with the default locale from the database
 * so that the middleware can use it for routing decisions
 */
export default function DefaultLocaleCookieManager() {
  const { settings } = useSettings();

  useEffect(() => {
    if (settings?.language) {
      // Set a cookie that the middleware can read
      document.cookie = `defaultLocale=${settings.language}; path=/; max-age=31536000`; // 1 year
    }
  }, [settings?.language]);

  // This component doesn't render anything
  return null;
}
