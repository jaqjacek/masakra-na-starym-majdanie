import React from 'react';
import { VERSION_INFO } from '../constants/version';

const Footer = () => {
  return (
    <footer className="app-footer">
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
