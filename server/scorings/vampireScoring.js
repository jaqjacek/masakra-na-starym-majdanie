export class VampireScoring {
  /**
   * Calculates points for Vampire placement based on distance to Jakub.
   * @param {number} dist - Chebyshev distance to Jakub
   * @param {number} vCount - Count of vampires in the set
   * @returns {number} Points gained
   */
  static calculate(dist, vCount) {
    if (vCount <= 0) return 0;
    return Math.max(0, 4 - dist) * vCount;
  }
}
