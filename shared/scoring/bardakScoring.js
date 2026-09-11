import {
  JAKUB_MELEE_DISTANCE,
  BARDAK_FINAL_MAJORITY_BONUS,
  RACES
} from '../constants.js';

export class BardakScoring {
  /**
   * Calculates points for Bardak placement based on distance to Jakub.
   * @param {number} dist - Chebyshev distance to Jakub
   * @param {number} bCount - Count of bardaks in the set
   * @returns {number} Points gained
   */
  static calculate(dist, bCount) {
    if (bCount <= 0) return 0;
    return (dist <= JAKUB_MELEE_DISTANCE) ? 0 : bCount;
  }

  static calculateFinal(regions) {
    let addedPoints = 0;
    regions.forEach(r => {
      const myCount = r.pawns?.bardak?.length || r.pawns?.B?.length || 0;
      if (myCount > 0) {
        let othersCounts = RACES.filter(race => race !== 'bardak').map(race => r.pawns?.[race]?.length || 0);
        const maxOther = Math.max.apply(null, othersCounts);
        if (myCount > maxOther) {
          addedPoints += BARDAK_FINAL_MAJORITY_BONUS;
        }
      }
    });
    return addedPoints;
  }
}
