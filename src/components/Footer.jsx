import React from 'react';
import { VERSION_INFO } from '../constants/version';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <a href="/api/docs/api" target="_blank" rel="noopener noreferrer">Dokumentacja API</a>
        <a 
          href="/docs/game" 
          onClick={(e) => { 
            e.preventDefault(); 
            window.history.pushState({}, '', '/docs/game'); 
            window.dispatchEvent(new PopStateEvent('popstate')); 
          }}
        >
          Zasady Gry
        </a>
      </div>
      <div className="footer-content">
        <span className="version-badge">{VERSION_INFO.tag}</span>
        <span className="branch-info">gałąź: <strong>{VERSION_INFO.branch}</strong></span>
        <span className="build-hash">skrót: <code>{VERSION_INFO.hash}</code></span>
        <span className="build-date">{VERSION_INFO.date} {VERSION_INFO.time}</span>
      </div>
    </footer>
  );
};

export default Footer;
