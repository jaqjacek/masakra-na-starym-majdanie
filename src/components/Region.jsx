import React from 'react';
import { PAWN_TYPES, STATUSES, SUMMARY_PAWN_IDS } from '../constants/pawnTypes';
import { useTranslation } from '../hooks/useTranslation';

const Region = ({ pawnGroups, onMouseUp, onRemovePawn, onAddPawn, onPawnMouseDown, setHoveredPawn, isValidTarget, onMouseEnter, onMouseLeave, showCounters = true, witnessGlowRaces = [] }) => {
  const { t } = useTranslation();
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
          if (typeId === 'jakub') return null; // Rendered by JakubOverlay

          const pawnType = PAWN_TYPES.find(t => t.id === typeId);
          if (!pawnType) return null;
          
          return instances.map((pawn, pIdx) => {
            const isEnabled = pawn.statuses.includes(STATUSES.ENABLED);
            const isWitness = witnessGlowRaces.includes(typeId);
            
            return (
              <div 
                key={`${typeId}-${pIdx}`} 
                className={`pawn-indicator ${typeId} ${!isEnabled ? 'disabled-pawn' : ''} ${isWitness ? 'witness-glow' : ''}`}
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
                title={isEnabled ? t('pawn_tooltip_drag') : t('pawn_tooltip_blocked')}
              />
            );
          });
        })}
      </div>

      {showCounters && (
        <div className="region-summary">
        {summary.map(type => (
          <div 
            key={type.id} 
            className="summary-item" 
            title={t('pawn_tooltip_add_remove', { name: t(type.id) })}
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
      )}
    </div>
  );
};

export default Region;
