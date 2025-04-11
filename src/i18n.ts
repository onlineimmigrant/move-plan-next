// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Example translations (replace with your actual translations)
const resources = {
  en: {
    translation: {
      Browse: 'Browse',
    },
  },
  // Add other languages as needed
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;