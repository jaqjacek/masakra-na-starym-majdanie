import React from 'react';
import { PAWN_TYPES, STATUSES } from '../constants/pawnTypes';

const Region = ({ index, pawnGroups, onMouseUp, onRemovePawn, onAddPawn, onPawnMouseDown, setHoveredPawn, isValidTarget }) => {
  const summary = PAWN_TYPES.map(type => ({
    ...type,
    count: pawnGroups[type.id] ? pawnGroups[type.id].length : 0
  })).sort((a, b) => b.count - a.count);

  return (
    <div 
      className={`region ${isValidTarget ? 'valid-target' : ''}`}
      onMouseUp={onMouseUp}
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
                  if (e.shiftKey) {
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
                title={isEnabled ? "Drag to move, Shift+Click to remove" : "Disabled - Cannot move, Shift+Click to remove"}
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
            title={`Shift+Click to add ${type.name}`}
            onClick={(e) => {
              if (e.shiftKey) {
                e.stopPropagation();
                onAddPawn(type.id);
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
