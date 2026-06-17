import React from 'react';
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from '../../constants/pawnTypes';

const JakubPanel = ({ jakub, onUpdateCounter, onJakubMouseDown, isJakubOnBoard, sets = [], onMouseUp, isDraggingSet }) => {
  if (!jakub) return null;

  const handleMouseDown = (e, path) => {
    if (e.shiftKey) {
      if (e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
        onUpdateCounter(path, 1);
      }
    } else if (e.ctrlKey) {
      if (e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
        onUpdateCounter(path, 0, true); // Sets to 0
      }
    }
  };

  const normalPawnTypes = PAWN_TYPES.filter(p => !p.isUnique);

  return (
    <div className={`jakub-panel ${isDraggingSet ? 'dragging-set-target' : ''}`} onMouseUp={onMouseUp}>
      <h3>Jakub</h3>
      
      <div className="jakub-stats">
        <div 
          className="jakub-stat-row" 
          onMouseDown={(e) => handleMouseDown(e, ['speed'])}
          title="Shift+LPP: +1 | Ctrl+LPP: Set to 0"
        >
          <span>S:</span> <strong>{jakub.speed}</strong>
        </div>
        <div 
          className="jakub-stat-row" 
          onMouseDown={(e) => handleMouseDown(e, ['range'])}
          title="Shift+LPP: +1 | Ctrl+LPP: Set to 0"
        >
          <span>R:</span> <strong>{jakub.range}</strong>
        </div>
      </div>
      
      <div className="jakub-anger-list">
        {normalPawnTypes.map(type => (
          <div 
            key={type.id} 
            className="jakub-anger-item"
            onMouseDown={(e) => handleMouseDown(e, ['anger', type.id])}
            title="Shift+LPP: +1 | Ctrl+LPP: Set to 0"
          >
            <div className={`anger-icon ${type.id}`}></div>
            <span>{jakub.anger[type.id]}</span>
          </div>
        ))}
      </div>

      <div className="jakub-sets-mini">
        {sets.map((set, index) => (
          <div key={`${set.id}-${index}`} className="mini-set" title={`Power: ${set.power}`}>
            <div className="mini-set-content">
              {SUMMARY_PAWN_IDS.map(typeId => {
                const count = set.content[typeId] || 0;
                return Array.from({ length: count }).map((_, i) => (
                  <div key={`${typeId}-${i}`} className="mini-item">
                    <div className={`set-icon ${typeId}`}></div>
                  </div>
                ));
              })}
            </div>
          </div>
        ))}
      </div>

      {!isJakubOnBoard && (
        <button 
          className="jakub-place-btn"
          onMouseDown={(e) => onJakubMouseDown(e)}
          title="Drag Jakub to the map"
        >
          J
        </button>
      )}
    </div>
  );
};

export default JakubPanel;
