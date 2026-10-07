import React from 'react';
import { Scoring } from '../../../shared/scoring/scoring.js';
import { RACES, RACE_TO_ABBR } from '../../../shared/constants.js';

/** Per-race point preview shown next to a dragged set while hovering a valid region. */
const SetGhostPointsPopup = ({ regions, hoveredRegionId, activeSet }) => {
  if (!regions || hoveredRegionId === null || !activeSet || !activeSet.set || !activeSet.set.content) {
    return null;
  }
  const targetRegion = regions.find(r => r && r.id === hoveredRegionId);
  if (!targetRegion) return null;

  let placementScores;
  try {
    placementScores = Scoring.calculatePlacementPoints(regions, targetRegion, activeSet.set.content);
  } catch (err) {
    console.error("Error calculating placement points:", err);
    return null;
  }

  if (!placementScores) return null;

  return (
    <div className="set-ghost-points-popup">
      {RACES.map(race => {
        const abbr = RACE_TO_ABBR[race];
        const pts = placementScores[abbr] || 0;
        const ptsClass = pts > 0 ? 'pts-positive' : pts < 0 ? 'pts-negative' : 'pts-zero';
        const ptsString = pts >= 0 ? `+${pts}` : `${pts}`;

        return (
          <div key={race} className="popup-item">
            <div className={`set-icon ${race}`} />
            <span className={`race-pts ${ptsClass}`}>{ptsString}</span>
          </div>
        );
      })}
    </div>
  );
};

export default SetGhostPointsPopup;
