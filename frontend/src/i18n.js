import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

const SUPPORTED_LANGS = ['pt', 'en', 'es', 'fr'];

// Determine the starting language from localStorage, falling back to 'pt'.
// We do NOT use LanguageDetector here — it resolves full locale tags like
// 'en-US' which don't match our supportedLngs and cause Select value mismatches.
function detectLanguage() {
    const stored = localStorage.getItem('i18nextLng');
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
    // Attempt to match browser language root (e.g. 'en-US' → 'en')
    const nav = navigator.language?.split('-')[0];
    if (nav && SUPPORTED_LANGS.includes(nav)) return nav;
    return 'pt';
}

// Translation files are loaded from public/locales/{lng}/translation.json
i18n
    .use(HttpApi)
    .use(initReactI18next)
    .init({
        lng: detectLanguage(),
        fallbackLng: 'pt',
        supportedLngs: SUPPORTED_LANGS,
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        backend: {
            loadPath: '/locales/{{lng}}/translation.json',
        },
        react: {
            useSuspense: false,
        },
    });

// Force language from backend/external setting if it differs from current
export function setLanguage(lang) {
    if (lang && SUPPORTED_LANGS.includes(lang) && i18n.language !== lang) {
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
    }
}

export default i18n;
