import {
  BOARD_SIZE,
  GHOST_SCORING_BASE,
  GHOST_FINAL_SCORING_BONUS,
  GHOST_FINAL_SCORING_MAX_OTHER_BONUS,
  JAKUB_MELEE_DISTANCE,
  RACES,
  regionXY
} from '../constants.js';

export class GhostScoring {
  /**
   * Calculates points for Ghost placement based on edge distance and melee distance to Jakub.
   * @param {Object} targetRegion - Region where the set is placed
   * @param {number} dist - Chebyshev distance to Jakub
   * @param {number} gCount - Count of ghosts in the set
   * @returns {number} Points gained
   */
  static calculate(targetRegion, dist, gCount) {
    if (gCount <= 0 || !targetRegion) return 0;
    
    const { x: rx, y: ry } = regionXY(targetRegion);
    const edge = BOARD_SIZE - 1;

    const distToEdge = Math.min(
      rx,
      edge - rx,
      ry,
      edge - ry
    );

    let perPawn = GHOST_SCORING_BASE - distToEdge;
    if (dist <= JAKUB_MELEE_DISTANCE) {
      perPawn -= 1;
    }
    
    return perPawn * gCount;
  }

  static calculateFinal(regions) {
    let addedPoints = 0;
    regions.forEach(r => {
      const myCount = r.pawns?.ghost?.length || r.pawns?.G?.length || 0;
      if (myCount > 0) {
        let others = RACES.filter(race => race !== 'ghost').map(race => r.pawns?.[race]?.length || 0);
        const othersTotal = others.reduce((a, b) => a + b, 0);
        if (othersTotal === 0) {
          addedPoints += GHOST_FINAL_SCORING_BONUS;
        } else {
          const maxOther = Math.max.apply(null, others);
          if (myCount > maxOther) {
            addedPoints += GHOST_FINAL_SCORING_MAX_OTHER_BONUS;
          }
        }
      }
    });
    return addedPoints;
  }
}
