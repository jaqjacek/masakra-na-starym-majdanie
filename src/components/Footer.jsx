import React from 'react';
import { VERSION_INFO } from '../constants/version';
import { useTranslation } from '../hooks/useTranslation';

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
        <div className="language-selector" style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
          <button 
            onClick={() => changeLanguage('en')} 
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            style={{ 
              background: 'none', 
              border: lang === 'en' ? '1px solid #fff' : '1px solid transparent', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontSize: '18px', 
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="English"
          >
            🇬🇧
          </button>
          <button 
            onClick={() => changeLanguage('pl')} 
            className={`lang-btn ${lang === 'pl' ? 'active' : ''}`}
            style={{ 
              background: 'none', 
              border: lang === 'pl' ? '1px solid #fff' : '1px solid transparent', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontSize: '18px', 
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Polski"
          >
            🇵🇱
          </button>
          <button 
            onClick={() => changeLanguage('cs')} 
            className={`lang-btn ${lang === 'cs' ? 'active' : ''}`}
            style={{ 
              background: 'none', 
              border: lang === 'cs' ? '1px solid #fff' : '1px solid transparent', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontSize: '18px', 
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Čeština"
          >
            🇨🇿
          </button>
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
