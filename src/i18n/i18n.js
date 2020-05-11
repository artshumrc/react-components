import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';

const resources = {
  en: {
    translation: en
  }
};

i18n
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources
  });

export default i18n;