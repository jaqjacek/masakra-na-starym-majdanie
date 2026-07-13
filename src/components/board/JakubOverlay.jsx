import React from 'react';

const JakubOverlay = ({ jakub, region, autoplaySpeed, onMouseEnter, onMouseLeave }) => {
  if (!jakub || !region) return null;

  // Center of the region in percentages
  const leftPercent = (region.x + 0.5) * (100 / 6);
  const topPercent = (region.y + 0.5) * (100 / 6);

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
