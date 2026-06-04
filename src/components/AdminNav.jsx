import React from 'react';
import '../assets/css/admin.css';

const AdminNav = ({ currentPath }) => {
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="admin-nav-bar">
      <div className="admin-nav-left">
        <button className="action-button" style={{ backgroundColor: '#7f8c8d' }} onClick={() => window.location.href = '/'}>
          ← Landing Page
        </button>
        <h2 className="admin-nav-title">Admin Dashboard</h2>
      </div>
      <div className="admin-nav-links">
        <button 
          className={`nav-link-btn ${currentPath === '/admin/sets' ? 'active' : ''}`}
          onClick={() => navigate('/admin/sets')}
        >
          Manage Sets
        </button>
        <button 
          className={`nav-link-btn ${currentPath === '/admin/events' ? 'active' : ''}`}
          onClick={() => navigate('/admin/events')}
        >
          Manage Events
        </button>
        <button 
          className={`nav-link-btn ${currentPath === '/admin/simulate' ? 'active' : ''}`}
          onClick={() => navigate('/admin/simulate')}
        >
          Simulate Games
        </button>
      </div>
    </div>
  );
};

export default AdminNav;
