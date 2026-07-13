import React from 'react';

export default function JakubTracksManager({
  jakubPath = [],
  regions = [],
  currentRound,
  currentPhase,
  visible = true
}) {
  if (!visible || !jakubPath || jakubPath.length === 0) return null;

  return (
    <svg className="jakub-tracks-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
      {/* Define a filter for the active phase glow */}
      <defs>
        <filter id="footprint-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {jakubPath.map((segment, idx) => {
        const fromRegion = regions.find(r => r.id === segment.from);
        const toRegion = regions.find(r => r.id === segment.to);

        if (!fromRegion || !toRegion) return null;

        // Calculate center percentage coordinates (0-100 range in SVG)
        const x1 = (fromRegion.x + 0.5) * (100 / 6);
        const y1 = (fromRegion.y + 0.5) * (100 / 6);
        const x2 = (toRegion.x + 0.5) * (100 / 6);
        const y2 = (toRegion.y + 0.5) * (100 / 6);

        // Vector calculations
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len === 0) return null;

        const ux = dx / len;
        const uy = dy / len;
        const px = -uy; // Perpendicular vector x
        const py = ux;  // Perpendicular vector y

        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        // Define footsteps along this segment
        // Alternate left/right offset perpendicularly (offset width = ~1.2% of board)
        const offsetDist = 1.2;
        const steps = [
          { t: 0.22, isLeft: true },
          { t: 0.38, isLeft: false },
          { t: 0.54, isLeft: true },
          { t: 0.70, isLeft: false },
          { t: 0.86, isLeft: true }
        ];

        const isActive = segment.round === currentRound && segment.phase === currentPhase;
        const className = `jakub-footstep ${isActive ? 'active' : 'inactive'}`;

        return (
          <g key={`track-segment-${idx}`} className={`jakub-track-segment ${isActive ? 'active-segment' : 'past-segment'}`}>
            {/* Draw a subtle faint dashed guideline under the footsteps */}
            <line 
              x1={x1} 
              y1={y1} 
              x2={x2} 
              y2={y2} 
              className={`jakub-track-line ${isActive ? 'active' : 'inactive'}`}
            />
            
            {steps.map((step, sIdx) => {
              // Interpolated position along segment
              const targetT = step.t;
              const baseX = x1 + dx * targetT;
              const baseY = y1 + dy * targetT;

              // Perpendicular offset for walking width
              const sideOffset = step.isLeft ? -offsetDist : offsetDist;
              const footX = baseX + px * sideOffset;
              const footY = baseY + py * sideOffset;

              return (
                <g
                  key={`step-${idx}-${sIdx}`}
                  className={className}
                  transform={`translate(${footX}, ${footY}) rotate(${angle + 90}) scale(0.18)`}
                  filter={isActive ? "url(#footprint-glow)" : undefined}
                >
                  {/* Gumboot Sole (wide toe area) */}
                  <path
                    d="M -3.5 -5 C -3.5 -9, 3.5 -9, 3.5 -5 C 3.5 -2, 2.5 0, 1.5 2 L -1.5 2 C -2.5 0, -3.5 -2, -3.5 -5 Z"
                    fill="currentColor"
                  />
                  {/* Gumboot Heel */}
                  <rect
                    x="-2.2"
                    y="4"
                    width="4.4"
                    height="4"
                    rx="1.5"
                    fill="currentColor"
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
