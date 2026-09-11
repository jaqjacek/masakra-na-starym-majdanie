import React, { useState } from 'react';
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from '../../constants/pawnTypes';
import { useTranslation } from '../../hooks/useTranslation';
import '../../assets/css/panels/sets.css';

const SetsPanel = ({ sets, discardedSets = [], onSetMouseDown, title, setInfo, hideTabs = false, placementPool, isMobileUi = false, selectedSetId = null }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('active');

  const currentSets = activeTab === 'active' ? sets : discardedSets;
  if (!currentSets) return null;

  const displaySetName = setInfo?.displayName || setInfo?.setName || "Unknown Set";

  const sortedSets = [...currentSets].sort((a, b) => {
    if (a.used === b.used) return 0;
    return a.used ? 1 : -1;
  });

  return (
    <div className="sets-panel">
      {!hideTabs && (
        <div className="sets-panel-tabs">
          <button 
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            {t('active_sets_tab', { count: sets.length })}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'discarded' ? 'active' : ''}`}
            onClick={() => setActiveTab('discarded')}
          >
            {t('discarded_sets_tab', { count: discardedSets.length })}
          </button>
        </div>
      )}

      <div className="sets-panel-header compact-row">
        <div className="header-left-group">
          <h3>{activeTab === 'active' ? (title || t('sets_title_default')) : t('discard_pile_title')}</h3>
        </div>
        
        {activeTab === 'active' && displaySetName && displaySetName !== "Unknown Set" && displaySetName !== "default" && (
          <div className="header-right-group">
            <span className="active-set-name" title={setInfo?.description || ""}>
              {t('active_set_prefix')} <strong>{displaySetName}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="sets-container">
        {sortedSets.length === 0 ? (
          <div className="no-sets-message">{t('no_sets_message')}</div>
        ) : (
          sortedSets.map((set, index) => {
            const cannotPlaceOnBoard = !set.used && activeTab === 'active' && placementPool && Object.entries(set.content).some(([tId, count]) => {
              return (placementPool[tId] || 0) < count;
            });

            return (
              <div 
                key={`${set.id}-${index}`} 
                className={`pawn-set ${set.used || activeTab === 'discarded' ? 'used' : ''} ${cannotPlaceOnBoard ? 'cannot-place-board' : ''} ${selectedSetId !== null && selectedSetId !== undefined && String(selectedSetId) === String(set.id) ? 'selected' : ''}`}
                onMouseDown={(e) => {
                  if (isMobileUi || set.used || activeTab !== 'active') return;
                  onSetMouseDown(set, e);
                }}
                onClick={(e) => {
                  if (!isMobileUi || set.used || activeTab !== 'active') return;
                  onSetMouseDown(set, e);
                }}
                title={set.used || activeTab === 'discarded' ? t('drag_tooltip_used') : (cannotPlaceOnBoard ? t('drag_tooltip_blocked') : t('drag_tooltip_normal'))}
              >
                <div className="set-content">
                  {SUMMARY_PAWN_IDS.map(typeId => {
                    const count = set.content[typeId] || 0;
                    return Array.from({ length: count }).map((_, i) => (
                      <div key={`${typeId}-${i}`} className={`set-icon ${typeId}`}></div>
                    ));
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SetsPanel;
