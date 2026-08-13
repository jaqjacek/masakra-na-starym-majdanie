import React, { useState, useEffect, useRef } from 'react';
import { VERSION_INFO } from '../constants/version';
import { useTranslation } from '../hooks/useTranslation';
import { WORLD_LANGUAGES } from '../constants/languages';

const Footer = () => {
  const { t, lang, changeLanguage } = useTranslation();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const currentLangItem = WORLD_LANGUAGES.find(l => l.code === lang) || WORLD_LANGUAGES[0];

  useEffect(() => {
    if (isLangModalOpen) {
      setSearchQuery('');
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isLangModalOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLangModalOpen) {
        setIsLangModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLangModalOpen]);

  const filteredLanguages = WORLD_LANGUAGES.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      item.englishName.toLowerCase().includes(q) ||
      (item.polishName && item.polishName.toLowerCase().includes(q)) ||
      item.code.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
    );
  });

  const handleSelectLanguage = (code) => {
    setIsLangModalOpen(false);
    if (code !== lang) {
      changeLanguage(code);
    }
  };

  const handleKeyDownInput = (e) => {
    if (e.key === 'Enter' && filteredLanguages.length > 0) {
      handleSelectLanguage(filteredLanguages[0].code);
    }
  };

  return (
    <>
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
          <div className="language-selector" style={{ marginRight: '12px' }}>
            <button 
              onClick={() => setIsLangModalOpen(true)} 
              className="lang-picker-btn"
              title={t('choose_language', { defaultValue: 'Wybierz język / Choose language' })}
            >
              <span className="search-icon">🔍</span>
              <span className="lang-flag-corner">{currentLangItem.flag}</span>
            </button>
          </div>
          <span className="version-badge">{VERSION_INFO.tag}</span>
          <span className="branch-info">{t('version_branch')} <strong>{VERSION_INFO.branch}</strong></span>
          <span className="build-hash">{t('version_hash')} <code>{VERSION_INFO.hash}</code></span>
          <span className="build-date">{VERSION_INFO.date} {VERSION_INFO.time}</span>
        </div>
      </footer>

      {isLangModalOpen && (
        <div className="lang-modal-overlay no-print" onClick={() => setIsLangModalOpen(false)}>
          <div className="lang-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="lang-modal-header">
              <h3 className="lang-modal-title">
                <span>🌐</span> {t('language_modal_title', { defaultValue: 'Wybierz język' })} ({WORLD_LANGUAGES.length})
              </h3>
              <button 
                className="lang-modal-close-btn" 
                onClick={() => setIsLangModalOpen(false)}
                title="Zamknij"
              >
                ×
              </button>
            </div>

            <div className="lang-search-wrapper">
              <div className="lang-search-input-box">
                <span className="lang-search-icon">🔍</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="lang-search-input"
                  placeholder={t('language_search_placeholder', { defaultValue: 'Szukaj języka...' })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDownInput}
                />
                {searchQuery && (
                  <button 
                    className="lang-search-clear" 
                    onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="lang-list">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map(item => (
                  <div
                    key={item.code}
                    className={`lang-item ${lang === item.code ? 'active' : ''}`}
                    onClick={() => handleSelectLanguage(item.code)}
                  >
                    <div className="lang-item-left">
                      <span className="lang-item-flag">{item.flag}</span>
                      <div className="lang-item-names">
                        <span className="lang-item-main">{item.name}</span>
                        <span className="lang-item-sub">
                          {item.polishName && item.polishName !== item.name ? `${item.polishName} • ` : ''}{item.englishName}
                        </span>
                      </div>
                    </div>
                    {lang === item.code && <span className="lang-item-check">✓</span>}
                  </div>
                ))
              ) : (
                <div className="lang-empty-message">
                  {t('language_no_results', { defaultValue: 'Nie znaleziono języka' })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
