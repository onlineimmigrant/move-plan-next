import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import your translations
import en from './locales/en.json';
import fr from './locales/fr.json';
import pl from './locales/pl.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';
import be from './locales/be.json';  
import de from './locales/de.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import it from './locales/it.json';

const savedLanguage = localStorage.getItem('language') || 'en';  // Get saved language or fallback to English

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      pl: { translation: pl },
      ru: { translation: ru },
      uk: { translation: uk },
      be: { translation: be },  // Belarusian
      de: { translation: de },
      es: { translation: es },
      pt: { translation: pt },
      it: { translation: it },
    },
    lng: savedLanguage,  // Initialize the app with the saved language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,  // React already escapes by default
    },
  });

export default i18n;
