import React from 'react';
import { PAWN_TYPES } from '../constants/pawnTypes';

const JakubPanel = ({ jakub, onUpdateCounter, onJakubMouseDown, isJakubOnBoard }) => {
  if (!jakub) return null;

  const handleClick = (e, path) => {
    e.preventDefault();
    if (e.shiftKey) onUpdateCounter(path, 1);
    else if (e.ctrlKey) onUpdateCounter(path, -1);
  };

  const normalPawnTypes = PAWN_TYPES.filter(p => !p.isUnique);

  return (
    <div className="jakub-panel">
      <h3>Jakub Parameters</h3>
      
      <div className="jakub-stats">
        <div className="jakub-stat-row" onClick={(e) => handleClick(e, ['speed'])}>
          <span>Speed:</span> <strong>{jakub.speed}</strong>
        </div>
        <div className="jakub-stat-row" onClick={(e) => handleClick(e, ['range'])}>
          <span>Range:</span> <strong>{jakub.range}</strong>
        </div>
      </div>
      
      <h4>Anger Counters</h4>
      <div className="jakub-anger-list">
        {normalPawnTypes.map(type => (
          <div 
            key={type.id} 
            className="jakub-anger-item"
            onClick={(e) => handleClick(e, ['anger', type.id])}
          >
            <div className={`anger-icon ${type.id}`}></div>
            <span>{jakub.anger[type.id]}</span>
          </div>
        ))}
      </div>

      <button 
        className={`jakub-place-btn ${isJakubOnBoard ? 'disabled' : ''}`}
        onMouseDown={(e) => !isJakubOnBoard && onJakubMouseDown(e)}
        title={isJakubOnBoard ? "Jakub is already on the map" : "Drag Jakub to the map"}
      >
        J
      </button>
    </div>
  );
};

export default JakubPanel;
