import React from 'react';
import { PAWN_TYPES, SUMMARY_PAWN_IDS } from '../../constants/pawnTypes';
import { useTranslation } from '../../hooks/useTranslation';
import '../../assets/css/panels/jakub.css';

const JakubPanel = ({ jakub, onUpdateCounter, onJakubMouseDown, isJakubOnBoard, sets = [], onMouseUp, isDraggingSet, isMobileUi = false }) => {
  const { t } = useTranslation();
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
  
  // Calculate maximum anger level among normal pawn types to highlight
  const maxAnger = Math.max(...normalPawnTypes.map(type => jakub.anger[type.id] || 0));

  return (
    <div className={`jakub-panel ${isDraggingSet ? 'dragging-set-target' : ''}`} onMouseUp={onMouseUp}>
      <h3>Jakub</h3>
      
      <div className="jakub-stats">
        <div 
          className="jakub-stat-row" 
          onMouseDown={(e) => handleMouseDown(e, ['range'])}
          title={t('points_click_tooltip', { defaultValue: 'Shift+LPP: +1 | Ctrl+LPP: Set to 0' })}
        >
          <span>{t('jakub_range_label', { defaultValue: 'Range:' })}</span> <strong>{jakub.range}</strong>
        </div>
      </div>
      
      <h4>{t('jakub_anger_level_title', { defaultValue: 'Poziom Furii' })}</h4>
      <div className="jakub-anger-list">
        {normalPawnTypes.map(type => {
          const angerValue = jakub.anger[type.id] || 0;
          const isMaxAnger = maxAnger > 0 && angerValue === maxAnger;
          return (
            <div 
              key={type.id} 
              className={`jakub-anger-item ${isMaxAnger ? 'max-anger' : ''}`}
              onMouseDown={(e) => handleMouseDown(e, ['anger', type.id])}
              title={t('points_click_tooltip', { defaultValue: 'Shift+LPP: +1 | Ctrl+LPP: Set to 0' })}
            >
              <div className={`anger-icon ${type.id}`}></div>
              <span>{angerValue}</span>
            </div>
          );
        })}
      </div>

      <h4>{t('jakub_sets_title', { defaultValue: 'Zestawy' })}</h4>
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
          onMouseDown={(e) => { if (!isMobileUi) onJakubMouseDown(e); }}
          onClick={(e) => { if (isMobileUi) onJakubMouseDown(e); }}
          title={t('drag_jakub_tooltip', { defaultValue: 'Drag Jakub to the map' })}
        >
          J
        </button>
      )}
    </div>
  );
};

export default JakubPanel;
