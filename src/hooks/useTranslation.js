import { useState, useCallback } from 'react';
import pl from '../locales/pl.json';
import en from '../locales/en.json';
import cs from '../locales/cs.json';

const translations = { pl, en, cs };

export const useTranslation = () => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  const changeLanguage = useCallback((newLang) => {
    localStorage.setItem('lang', newLang);
    setLang(newLang);
    window.location.reload();
  }, []);

  const t = useCallback((key, replacements = {}) => {
    let value = translations[lang]?.[key] || translations['en']?.[key] || key;
    Object.entries(replacements).forEach(([k, v]) => {
      value = value.replace(new RegExp(`{${k}}`, 'g'), v);
    });
    return value;
  }, [lang]);

  return { t, lang, changeLanguage };
};
