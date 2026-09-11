import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { BOARD_SIZE } from '../../../shared/constants.js';

// Renders visual effects like explosions, floating points, and animal magnetism aura shockwaves over the board.
// Requires visualEffects array: [{ id, type: 'explosion' | 'text' | 'magnetism', regionId, race, text, timestamp, x, y }]
const VisualEffectsManager = ({ visualEffects, regions, visible = true }) => {
  const { t } = useTranslation();
  if (!visible || !visualEffects || visualEffects.length === 0) return null;

  return (
    <div className="visual-effects-overlay">
      {visualEffects.map(effect => {
        const region = regions.find(r => r.id === effect.regionId);
        if (!region) return null;

        // Base coordinates based on 6x6 grid.
        // x and y in region are 0-5.
        const leftPercent = (region.x + 0.5) * (100 / BOARD_SIZE);
        const topPercent = (region.y + 0.5) * (100 / BOARD_SIZE);

        const style = {
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
        };

        if (effect.type === 'magnetism' || effect.isMagnetism) {
          return (
            <React.Fragment key={effect.id}>
              <div 
                className="magnetism-aura-effect"
                style={style}
              />
              <div 
                className="effect-floating-text magnetism-banner"
                style={style}
              >
                {effect.text || t('animal_magnetism_banner', { defaultValue: 'ANIMAL MAGNETISM!' })}
              </div>
            </React.Fragment>
          );
        }

        if (effect.type === 'explosion') {
          return (
            <div 
              key={effect.id} 
              className={`effect-explosion race-${effect.race}`}
              style={style}
            >
              <div className="explosion-particle p1"></div>
              <div className="explosion-particle p2"></div>
              <div className="explosion-particle p3"></div>
              <div className="explosion-particle p4"></div>
              <div className="explosion-core"></div>
            </div>
          );
        }

        if (effect.type === 'text') {
          return (
            <div 
              key={effect.id} 
              className={`effect-floating-text race-${effect.race} ${effect.isPositive ? 'positive' : ''}`}
              style={style}
            >
              {effect.text}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default VisualEffectsManager;
