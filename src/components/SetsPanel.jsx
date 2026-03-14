import React from 'react';
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from '../constants/pawnTypes';

const SetsPanel = ({ sets, onSetMouseDown, title, setName }) => {
  if (!sets) return null;

  const totalSets = sets.length;
  const breakdown = SUMMARY_PAWN_IDS.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {});

  sets.forEach(set => {
    Object.entries(set.content).forEach(([typeId, count]) => {
      if (breakdown[typeId] !== undefined) breakdown[typeId] += count;
    });
  });

  const sortedSets = [...sets].sort((a, b) => {
    if (a.used === b.used) return 0;
    return a.used ? 1 : -1;
  });

  return (
    <div className="sets-panel">
      <div className="sets-panel-header compact-row">
        <div className="header-left-group">
          <h3>{title || "Sets"} ({totalSets})</h3>
          <div className="sets-total-breakdown compact">
            {SUMMARY_PAWN_IDS.map(id => (
              <div key={id} className="sets-breakdown-item" title={`${id} total`}>
                <div className={`breakdown-dot ${id}`}></div>
                <span>{breakdown[id]}</span>
              </div>
            ))}
          </div>
        </div>
        
        {setName && (
          <div className="header-right-group">
            <span className="active-set-name">Set: <strong>{setName}</strong></span>
          </div>
        )}
      </div>
      <div className="sets-container">
        {sortedSets.map((set) => (
          <div 
            key={set.id} 
            className={`pawn-set ${set.used ? 'used' : ''}`}
            onMouseDown={(e) => !set.used && onSetMouseDown(set, e)}
            title={set.used ? "Already used" : `Power: ${set.power} | Drag to a region or player`}
          >
            <div className="set-header">
              <span>Set {set.id}</span>
              <span className="power-badge">P: {set.power}</span>
            </div>
            <div className="set-content">
              {Object.entries(set.content).map(([typeId, count]) => (
                <div key={typeId} className="set-item">
                  <div className={`set-icon ${typeId}`}></div>
                  <span className="set-count">:{count}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetsPanel;
