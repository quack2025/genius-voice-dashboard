import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import Spanish translations
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esDashboard from './locales/es/dashboard.json';
import esProjects from './locales/es/projects.json';
import esLanding from './locales/es/landing.json';
import esAdmin from './locales/es/admin.json';
import esOrg from './locales/es/org.json';

// Import English translations
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enProjects from './locales/en/projects.json';
import enLanding from './locales/en/landing.json';
import enAdmin from './locales/en/admin.json';
import enOrg from './locales/en/org.json';

// Import Portuguese translations
import ptCommon from './locales/pt/common.json';
import ptAuth from './locales/pt/auth.json';
import ptDashboard from './locales/pt/dashboard.json';
import ptProjects from './locales/pt/projects.json';
import ptLanding from './locales/pt/landing.json';
import ptAdmin from './locales/pt/admin.json';
import ptOrg from './locales/pt/org.json';

export const SUPPORTED_LANGUAGES = ['es', 'en', 'pt'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
};

export const LOCALE_MAP: Record<SupportedLanguage, string> = {
  es: 'es-ES',
  en: 'en-US',
  pt: 'pt-BR',
};

const resources = {
  es: {
    common: esCommon,
    auth: esAuth,
    dashboard: esDashboard,
    projects: esProjects,
    landing: esLanding,
    admin: esAdmin,
    org: esOrg,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    projects: enProjects,
    landing: enLanding,
    admin: enAdmin,
    org: enOrg,
  },
  pt: {
    common: ptCommon,
    auth: ptAuth,
    dashboard: ptDashboard,
    projects: ptProjects,
    landing: ptLanding,
    admin: ptAdmin,
    org: ptOrg,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'projects', 'landing', 'admin', 'org'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'ui_language',
      caches: ['localStorage'],
    },
  });

export default i18n;
