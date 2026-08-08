import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import axios from 'axios';
import { installAuthRefreshInterceptor } from './services/authSession';

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

const savedLang = localStorage.getItem('i18nextLng') || 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
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
  const lang = localStorage.getItem('i18nextLng') || 'en';
  config.headers['Accept-Language'] = lang;
  return config;
});

// Components that import Axios directly share this interceptor. It retries a
// request with a new access token when the 15-minute token expires.
installAuthRefreshInterceptor(axios);

export default i18n;
