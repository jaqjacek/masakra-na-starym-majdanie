import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const TABS = [
  { id: 'players', key: 'tab_players' },
  { id: 'jakub', key: 'tab_jakub' },
  { id: 'game', key: 'tab_game' },
  { id: 'history', key: 'tab_history' }
];

const MobileTabBar = ({ active, onChange }) => {
  const { t } = useTranslation();

  return (
    <nav className="mobile-tab-bar" role="tablist" aria-label={t('tab_bar_label', { defaultValue: 'Game panels' })}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`mobile-tab-btn${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {t(tab.key)}
        </button>
      ))}
    </nav>
  );
};

export default MobileTabBar;
