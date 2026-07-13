import React from 'react';

// Renders visual effects like explosions and floating points over the board.
// Requires visualEffects array: [{ id, type: 'explosion' | 'text', regionId, race, text, timestamp, x, y }]
const VisualEffectsManager = ({ visualEffects, regions, visible = true }) => {
  if (!visible || !visualEffects || visualEffects.length === 0) return null;

  return (
    <div className="visual-effects-overlay">
      {visualEffects.map(effect => {
        const region = regions.find(r => r.id === effect.regionId);
        if (!region) return null;

        // Base coordinates based on 6x6 grid.
        // x and y in region are 0-5.
        // We'll calculate the center of the region.
        const leftPercent = (region.x + 0.5) * (100 / 6);
        const topPercent = (region.y + 0.5) * (100 / 6);

        const style = {
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
        };

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
              className={`effect-floating-text race-${effect.race} ${effect.isPositive ? 'positive' : ''} ${effect.isMagnetism ? 'magnetism' : ''}`}
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
