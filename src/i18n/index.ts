import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import comprehensive translation files for 5 languages
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  pt: { translation: pt }
};

// Supported languages configuration
export const supportedLanguages = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português'
};

// Detect browser language
const detectLanguage = () => {
  try {
    const browserLang = navigator.language.split('-')[0];
    const supportedLanguages = Object.keys(resources);
    return supportedLanguages.includes(browserLang) ? browserLang : 'en';
  } catch {
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || detectLanguage(),
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
      formatSeparator: ','
    },
    react: {
      useSuspense: false
    },
    // Add namespace support for better organization
    defaultNS: 'translation',
    ns: ['translation'],
    // Add missing key handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng}`);
      }
    }
  });

// Export language change helper
export const changeLanguage = (language: string) => {
  i18n.changeLanguage(language);
  localStorage.setItem('language', language);
  // Update HTML lang attribute for accessibility
  document.documentElement.lang = language;
};

// Export current language helper
export const getCurrentLanguage = () => i18n.language;

// Export translation helper with type safety
export const t = (key: string, options?: any) => i18n.t(key, options);

export default i18n;