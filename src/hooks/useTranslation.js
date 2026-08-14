import { useState, useEffect, useCallback } from 'react';

// Load all 110+ locale files dynamically using Vite's import.meta.glob
const localeModules = import.meta.glob('../locales/*.json', { eager: true });
const translations = {};

for (const path in localeModules) {
  const match = path.match(/\.\.\/locales\/(.+)\.json$/);
  if (match) {
    translations[match[1]] = localeModules[path].default || localeModules[path];
  }
}

const LANGUAGE_CHANGE_EVENT = 'app_language_change';

export const useTranslation = () => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLang(e.detail);
    };
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
  }, []);

  const changeLanguage = useCallback((newLang) => {
    localStorage.setItem('lang', newLang);
    setLang(newLang);
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: newLang }));
  }, []);

  const t = useCallback((key, replacements = {}) => {
    let value = translations[lang]?.[key] || translations['en']?.[key] || key;
    if (typeof value === 'string') {
      Object.entries(replacements).forEach(([k, v]) => {
        value = value.replace(new RegExp(`{${k}}`, 'g'), v);
      });
    }
    return value;
  }, [lang]);

  return { t, lang, changeLanguage };
};
