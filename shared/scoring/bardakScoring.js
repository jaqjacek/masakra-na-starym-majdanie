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

  static findBestPlacement(regions, emptyRegions, placeableSets) {
    let best = null;
    placeableSets.forEach(set => {
      emptyRegions.forEach(region => {
        const dist = region.jakubDistance;
        const pts = BardakScoring.calculate(dist, set.content.bardak || 0);
        if (!best) {
          best = { set, region, pts };
        } else {
          const bestDist = best.region.jakubDistance;
          if (dist > bestDist) {
            best = { set, region, pts };
          } else if (dist === bestDist && pts > best.pts) {
            best = { set, region, pts };
          }
        }
      });
    });
    return best;
  }
}
