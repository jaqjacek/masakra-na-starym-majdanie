import React from 'react';
import { VERSION_INFO } from '../constants/version';
import { useTranslation } from '../hooks/useTranslation';
import { WORLD_LANGUAGES } from '../constants/languages';

const Footer = () => {
  const { t, lang, changeLanguage } = useTranslation();

  return (
    <footer className="app-footer">
      <div className="footer-links">
        <a href="/api/docs/api" target="_blank" rel="noopener noreferrer">{t('api_nav')}</a>
        <a
          href="/docs/game"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/docs/game');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        >
          {t('rules_nav')}
        </a>
      </div>
      <div className="footer-content">
        <div className="language-selector" role="group" aria-label={t('choose_language')}>
          {WORLD_LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              className={`lang-icon-btn${lang === item.code ? ' active' : ''}`}
              onClick={() => changeLanguage(item.code)}
              title={item.name}
              aria-label={item.name}
              aria-pressed={lang === item.code}
            >
              <span className="lang-icon-flag" aria-hidden="true">{item.flag}</span>
            </button>
          ))}
        </div>
        <span className="version-badge">{VERSION_INFO.tag}</span>
        <span className="branch-info">{t('version_branch')} <strong>{VERSION_INFO.branch}</strong></span>
        <span className="build-hash">{t('version_hash')} <code>{VERSION_INFO.hash}</code></span>
        <span className="build-date">{VERSION_INFO.date} {VERSION_INFO.time}</span>
      </div>
    </footer>
  );
};

export default Footer;
