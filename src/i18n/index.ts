import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

const STORAGE_KEY = 'ezroom_lang';

export const defaultNS = 'translation';
export const supportedLngs = ['en', 'vi'] as const;
export type SupportedLang = (typeof supportedLngs)[number];

function getInitialLanguage(): string {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && supportedLngs.includes(stored as SupportedLang)) return stored;
        const browser = typeof navigator !== 'undefined' && navigator.language ? navigator.language.split('-')[0] : '';
        if (browser === 'en' || browser === 'vi') return browser;
    } catch {
        // ignore
    }
    return 'vi'; // app default is Vietnamese when no preference
}

i18n.use(initReactI18next).init({
    resources: {
        en: { [defaultNS]: en },
        vi: { [defaultNS]: vi },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'vi',
    defaultNS,
    supportedLngs,
    interpolation: {
        escapeValue: false,
    },
});

i18n.on('languageChanged', (lng) => {
    try {
        localStorage.setItem(STORAGE_KEY, lng);
    } catch {
        // ignore
    }
});

export default i18n;
