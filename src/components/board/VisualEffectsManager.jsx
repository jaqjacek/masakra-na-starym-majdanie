import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { BOARD_SIZE } from '../../../shared/constants.js';

// Renders visual effects like explosions, floating points, and animal magnetism aura shockwaves over the board.
// Requires visualEffects array: [{ id, type: 'explosion' | 'text' | 'magnetism', regionId, race, text, timestamp, x, y }]
const VisualEffectsManager = ({ visualEffects, regions, visible = true, showAnimations = true }) => {
  const { t } = useTranslation();
  const animationsOn = visible && showAnimations;
  const shown = (visualEffects || []).filter((effect) => {
    if (effect.spectator && effect.type === 'text') return true;
    if (effect.type === 'placement-flash') return animationsOn;
    return animationsOn;
  });
  if (!visible || shown.length === 0) return null;

  return (
    <div className="visual-effects-overlay">
      {shown.map(effect => {
        const region = regions.find(r => r.id === effect.regionId);
        if (!region) return null;

        // Base coordinates based on 6x6 grid.
        // x and y in region are 0-5. Floating texts rise from the region's top edge
        // so they don't cover Jakub / pawns; other effects stay centered.
        const cell = 100 / BOARD_SIZE;
        const isRisingText = effect.type === 'text' && !effect.isMagnetism;
        const anchorY = isRisingText ? region.y : region.y + 0.5;
        const leftPercent = (region.x + 0.5) * cell;
        const topPercent = anchorY * cell - (effect.stack || 0) * 3.2;

        const style = {
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
        };
        if (effect.durationMs) style.animationDuration = `${effect.durationMs}ms`;

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

        if (effect.type === 'placement-flash') {
          return <div key={effect.id} className="effect-placement-flash" style={style} />;
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
