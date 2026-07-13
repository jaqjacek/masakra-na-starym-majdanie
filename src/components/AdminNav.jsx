import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import '../assets/css/admin.css';

const AdminNav = ({ currentPath }) => {
  const { t } = useTranslation();
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="admin-nav-bar">
      <div className="admin-nav-left">
        <button className="action-button btn-back" onClick={() => window.location.href = '/'}>
          ← {t('landing_page_btn', { defaultValue: 'Landing Page' })}
        </button>
        <h2 className="admin-nav-title">{t('admin_dashboard_title', { defaultValue: 'Admin Dashboard' })}</h2>
      </div>
      <div className="admin-nav-links">
        <button 
          className={`nav-link-btn ${currentPath === '/admin/sets' ? 'active' : ''}`}
          onClick={() => navigate('/admin/sets')}
        >
          {t('admin_nav_sets', { defaultValue: 'Manage Sets' })}
        </button>
        <button 
          className={`nav-link-btn ${currentPath === '/admin/events' ? 'active' : ''}`}
          onClick={() => navigate('/admin/events')}
        >
          {t('admin_nav_events', { defaultValue: 'Manage Events' })}
        </button>
        <button 
          className={`nav-link-btn ${currentPath === '/admin/simulate' ? 'active' : ''}`}
          onClick={() => navigate('/admin/simulate')}
        >
          {t('admin_nav_simulate', { defaultValue: 'Simulate Games' })}
        </button>
      </div>
    </div>
  );
};

export default AdminNav;
