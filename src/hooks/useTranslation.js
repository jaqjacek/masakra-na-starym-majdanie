import { useState, useEffect, useCallback } from 'react';
import pl from '../locales/pl.json';
import en from '../locales/en.json';
import cs from '../locales/cs.json';
import de from '../locales/de.json';
import es from '../locales/es.json';
import it from '../locales/it.json';
import fr from '../locales/fr.json';
import fi from '../locales/fi.json';
import sv from '../locales/sv.json';
import ja from '../locales/ja.json';
import uk from '../locales/uk.json';
import zh from '../locales/zh.json';
import ru from '../locales/ru.json';
import pt from '../locales/pt.json';
import ko from '../locales/ko.json';

const translations = { pl, en, cs, de, es, it, fr, fi, sv, ja, uk, zh, ru, pt, ko };

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
    Object.entries(replacements).forEach(([k, v]) => {
      value = value.replace(new RegExp(`{${k}}`, 'g'), v);
    });
    return value;
  }, [lang]);

  return { t, lang, changeLanguage };
};
