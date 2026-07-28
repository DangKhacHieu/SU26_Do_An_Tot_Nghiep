import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import axios from 'axios';

import translationVI from './locales/vi.json';
import translationEN from './locales/en.json';

const resources = {
  vi: {
    translation: translationVI
  },
  en: {
    translation: translationEN
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    debug: false,
    interpolation: {
      escapeValue: false, // react already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Đồng bộ ngôn ngữ mặc định của Axios với ngôn ngữ của i18next
axios.interceptors.request.use((config) => {
  const lang = localStorage.getItem('i18nextLng') || 'vi';
  config.headers['Accept-Language'] = lang;
  return config;
});

export default i18n;
