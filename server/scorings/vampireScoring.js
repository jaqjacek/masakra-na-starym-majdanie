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

  /**
   * Searches for the best place to put a set for the Vampire race.
   */
  static findBestPlacement(regions, emptyRegions, placeableSets, calculatePlacementPoints) {
    let best = null;
    placeableSets.forEach(set => {
      emptyRegions.forEach(region => {
        const placementScores = calculatePlacementPoints(regions, region, set.content);
        const pts = placementScores.vampire || 0;
        if (!best || pts > best.pts) {
          best = { set, region, pts, allScores: placementScores };
        }
      });
    });
    return best;
  }
}
