import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_LANGUAGE, resolveLanguage } from '../constants/languages';
import { toPiqad } from '../utils/piqad';

const localeModules = import.meta.glob('../locales/*.json', { eager: true });
const translations = {};

for (const path in localeModules) {
  const match = path.match(/\.\.\/locales\/(.+)\.json$/);
  if (match) {
    translations[match[1]] = localeModules[path].default || localeModules[path];
  }
}

const LANGUAGE_CHANGE_EVENT = 'app_language_change';

const applyDocumentLang = (code) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = code;
  document.documentElement.classList.toggle('lang-tlh', code === 'tlh');
};

export const useTranslation = () => {
  const [lang, setLang] = useState(() => {
    const resolved = resolveLanguage(localStorage.getItem('lang'));
    if (localStorage.getItem('lang') !== resolved) {
      localStorage.setItem('lang', resolved);
    }
    applyDocumentLang(resolved);
    return resolved;
  });

  useEffect(() => {
    const handleLanguageChange = (e) => {
      const resolved = resolveLanguage(e.detail);
      setLang(resolved);
      applyDocumentLang(resolved);
    };
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
  }, []);

  const changeLanguage = useCallback((newLang) => {
    const resolved = resolveLanguage(newLang);
    localStorage.setItem('lang', resolved);
    setLang(resolved);
    applyDocumentLang(resolved);
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: resolved }));
  }, []);

  const t = useCallback((key, replacements = {}) => {
    let value = translations[lang]?.[key]
      || translations[DEFAULT_LANGUAGE]?.[key]
      || translations.en?.[key]
      || key;
    if (typeof value === 'string') {
      Object.entries(replacements).forEach(([k, v]) => {
        value = value.replace(new RegExp(`{${k}}`, 'g'), v);
      });
      if (lang === 'tlh') {
        value = toPiqad(value);
      }
    }
    return value;
  }, [lang]);

  return { t, lang, changeLanguage };
};
