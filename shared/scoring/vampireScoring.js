import {
  VAMPIRE_SCORING_RANGE,
  VAMPIRE_FINAL_SCORING_MULTIPLIER
} from '../constants.js';

export class VampireScoring {
  /**
   * Calculates points for Vampire placement based on distance to Jakub.
   * @param {number} dist - Chebyshev distance to Jakub
   * @param {number} vCount - Count of vampires in the set
   * @returns {number} Points gained
   */
  static calculate(dist, vCount) {
    if (vCount <= 0) return 0;
    return (VAMPIRE_SCORING_RANGE - dist) * vCount;
  }

  static calculateFinal(regions) {
    let regionsWithVampires = 0;
    regions.forEach(r => {
      if (r.pawns?.vampire?.length > 0 || r.pawns?.V?.length > 0) {
        regionsWithVampires++;
      }
    });
    return regionsWithVampires * VAMPIRE_FINAL_SCORING_MULTIPLIER;
  }
}
