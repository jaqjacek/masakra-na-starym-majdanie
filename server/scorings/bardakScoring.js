export class BardakScoring {
  /**
   * Calculates points for Bardak placement based on distance to Jakub.
   * @param {number} dist - Chebyshev distance to Jakub
   * @param {number} bCount - Count of bardaks in the set
   * @returns {number} Points gained
   */
  static calculate(dist, bCount) {
    if (bCount <= 0) return 0;
    return (dist <= 1) ? 0 : bCount;
  }
}
