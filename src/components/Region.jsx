import React from 'react';
import { PAWN_TYPES, STATUSES, SUMMARY_PAWN_IDS } from '../constants/pawnTypes';

const Region = ({ pawnGroups, onMouseUp, onRemovePawn, onAddPawn, onPawnMouseDown, setHoveredPawn, isValidTarget, onMouseEnter, onMouseLeave }) => {
  // Calculate summary counts for specific pawn types defined in SUMMARY_PAWN_IDS
  const summary = SUMMARY_PAWN_IDS.map(id => {
    const type = PAWN_TYPES.find(t => t.id === id);
    return {
      ...type,
      count: pawnGroups[id] ? pawnGroups[id].length : 0
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <div 
      className={`region ${isValidTarget ? 'valid-target' : ''}`}
      onMouseUp={onMouseUp}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="pawns-area">
        {Object.entries(pawnGroups).map(([typeId, instances]) => {
          const pawnType = PAWN_TYPES.find(t => t.id === typeId);
          if (!pawnType) return null;
          
          return instances.map((pawn, pIdx) => {
            const isEnabled = pawn.statuses.includes(STATUSES.ENABLED);
            
            return (
              <div 
                key={`${typeId}-${pIdx}`} 
                className={`pawn-indicator ${typeId} ${!isEnabled ? 'disabled-pawn' : ''}`}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  if (e.shiftKey) {
                    e.stopPropagation();
                    onAddPawn(typeId);
                  } else if (e.ctrlKey) {
                    e.stopPropagation();
                    onRemovePawn(typeId);
                  } else {
                    e.stopPropagation();
                    onPawnMouseDown(typeId, pIdx, e);
                  }
                }}
                onMouseEnter={(e) => {
                  setHoveredPawn({ pawn, pawnType, x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredPawn(null)}
                title={isEnabled ? "Przeciągnij, aby przesunąć | Shift+LPP: dodaj | Ctrl+LPP: usuń" : "Zablokowany | Shift+LPP: dodaj | Ctrl+LPP: usuń"}
              />
            );
          });
        })}
      </div>

      <div className="region-summary">
        {summary.map(type => (
          <div 
            key={type.id} 
            className="summary-item" 
            title={`Shift+LPP: Dodaj ${type.name} | Ctrl+LPP: Usuń ${type.name}`}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              if (e.shiftKey) {
                e.stopPropagation();
                onAddPawn(type.id);
              } else if (e.ctrlKey) {
                e.stopPropagation();
                onRemovePawn(type.id);
              }
            }}
          >
            <div className={`summary-icon ${type.id} ${type.count > 0 ? 'active' : ''}`}></div>
            <span className="summary-count">{type.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Region;
