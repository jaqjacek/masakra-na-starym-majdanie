import React from 'react';
import { VERSION_INFO } from '../constants/version';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <a href="/api/docs/api" target="_blank" rel="noopener noreferrer">API Docs</a>
        <a 
          href="/docs/game" 
          onClick={(e) => { 
            e.preventDefault(); 
            window.history.pushState({}, '', '/docs/game'); 
            window.dispatchEvent(new PopStateEvent('popstate')); 
          }}
        >
          Game Rules
        </a>
      </div>
      <div className="footer-content">
        <span className="version-badge">{VERSION_INFO.tag}</span>
        <span className="branch-info">branch: <strong>{VERSION_INFO.branch}</strong></span>
        <span className="build-hash">hash: <code>{VERSION_INFO.hash}</code></span>
        <span className="build-date">{VERSION_INFO.date} {VERSION_INFO.time}</span>
      </div>
    </footer>
  );
};

export default Footer;
