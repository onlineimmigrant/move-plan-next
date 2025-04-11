// src/components/I18nClientWrapper.tsx
'use client';

import React, { ReactNode, useEffect } from 'react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { resources } from '../locales';

const I18nClientWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';

    i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
      });

    // Update the HTML lang attribute when the language changes
    document.documentElement.lang = i18n.language;

    // Listen for language changes and update localStorage and HTML lang
    i18n.on('languageChanged', (lng) => {
      localStorage.setItem('language', lng);
      document.documentElement.lang = lng;
    });

    return () => {
      i18n.off('languageChanged');
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default I18nClientWrapper;