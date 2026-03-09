import React from 'react';
import { PAWN_TYPES } from '../App';

const Region = ({ index, pawnCounts, onMouseUp, onRemovePawn }) => {
  return (
    <div 
      className="region"
      onMouseUp={onMouseUp}
    >
      {Object.entries(pawnCounts).map(([typeId, count]) => {
        const pawnType = PAWN_TYPES.find(t => t.id === typeId);
        return (
          <div 
            key={typeId} 
            className={`pawn-indicator ${typeId}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemovePawn(typeId);
            }}
            title="Click to remove 1"
          >
            <div className="pawn-count">{count}</div>
          </div>
        );
      })}
    </div>
  );
};

export default Region;
