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

  /**
   * Searches for the best place to put a set for the Bardak race.
   */
  static findBestPlacement(regions, emptyRegions, placeableSets, calculatePlacementPoints) {
    let best = null;
    placeableSets.forEach(set => {
      emptyRegions.forEach(region => {
        const placementScores = calculatePlacementPoints(regions, region, set.content);
        const pts = placementScores.bardak || 0;
        if (!best || pts > best.pts) {
          best = { set, region, pts, allScores: placementScores };
        }
      });
    });
    return best;
  }
}
