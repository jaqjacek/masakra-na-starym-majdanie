import React, { useState } from 'react';
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from '../../constants/pawnTypes';

const SetsPanel = ({ sets, discardedSets = [], onSetMouseDown, title, setInfo, hideTabs = false }) => {
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
            Active ({sets.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'discarded' ? 'active' : ''}`}
            onClick={() => setActiveTab('discarded')}
          >
            Discarded ({discardedSets.length})
          </button>
        </div>
      )}

      <div className="sets-panel-header compact-row">
        <div className="header-left-group">
          <h3>{activeTab === 'active' ? (title || "Sets") : "Discarded Pile"}</h3>
        </div>
        
        {activeTab === 'active' && displaySetName && displaySetName !== "Unknown Set" && displaySetName !== "default" && (
          <div className="header-right-group">
            <span className="active-set-name" title={setInfo?.description || ""}>
              Active: <strong>{displaySetName}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="sets-container">
        {sortedSets.length === 0 ? (
          <div className="no-sets-message">No sets in this category.</div>
        ) : (
          sortedSets.map((set, index) => (
            <div 
              key={`${set.id}-${index}`} 
              className={`pawn-set ${set.used || activeTab === 'discarded' ? 'used' : ''}`}
              onMouseDown={(e) => !set.used && activeTab === 'active' && onSetMouseDown(set, e)}
              title={set.used || activeTab === 'discarded' ? "Cannot use this set" : `Power: ${set.power} | Drag to a region or player`}
            >
              <div className="set-header">
                <span>Set {set.id}</span>
                <span className="power-badge">P: {set.power}</span>
              </div>
              <div className="set-content">
                {SUMMARY_PAWN_IDS.map(typeId => {
                  const count = set.content[typeId] || 0;
                  return Array.from({ length: count }).map((_, i) => (
                    <div key={`${typeId}-${i}`} className={`set-icon ${typeId}`}></div>
                  ));
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SetsPanel;
