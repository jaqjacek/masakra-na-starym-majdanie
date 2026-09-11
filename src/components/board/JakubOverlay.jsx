import React from 'react';
import { BOARD_SIZE } from '../../../shared/constants.js';

const JakubOverlay = ({ jakub, region, autoplaySpeed, onMouseEnter, onMouseLeave }) => {
  if (!jakub || !region) return null;

  const leftPercent = (region.x + 0.5) * (100 / BOARD_SIZE);
  const topPercent = (region.y + 0.5) * (100 / BOARD_SIZE);

  return (
    <div 
      className="jakub-overlay-container"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        transition: `left ${autoplaySpeed}ms linear, top ${autoplaySpeed}ms linear`,
        zIndex: 10 // Above regions
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`pawn-indicator jakub ${!jakub.statuses?.includes('ENABLED') ? 'disabled-pawn' : ''}`} />
    </div>
  );
};

export default JakubOverlay;
