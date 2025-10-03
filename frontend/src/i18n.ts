import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en/translation.json';
import ruTranslation from './locales/ru/translation.json';

// Resources for different languages
const resources = {
  en: {
    translation: enTranslation,
  },
  ru: {
    translation: ruTranslation,
  },
};

i18n
  // Use LanguageDetector to automatically detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    
    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Cache user language in localStorage
      caches: ['localStorage'],
      
      // Key to store language in localStorage
      lookupLocalStorage: 'i18nextLng',
    },
    
    // Fallback language if detection fails
    fallbackLng: 'en',
    
    // Debug mode (set to false in production)
    debug: import.meta.env.DEV,
    
    // Interpolation options
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
    
    // React options
    react: {
      // Bind i18n instance to React context
      bindI18n: 'languageChanged',
      // Bind store to React context
      bindI18nStore: '',
      // Experimental: trans render inner JSX
      transEmptyNodeValue: '',
      // Experimental: trans what to return for empty string
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
      // Experimental: use React suspense
      useSuspense: false,
    },
  });

export default i18n;