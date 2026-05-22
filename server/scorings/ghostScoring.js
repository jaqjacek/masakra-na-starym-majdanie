export class GhostScoring {
  /**
   * Calculates points for Ghost placement based on edge distance and Jakub range.
   * @param {Object} targetRegion - Region where the set is placed
   * @param {number} dist - Chebyshev distance to Jakub
   * @param {number} jakubRange - Current movement range of Jakub
   * @param {number} gCount - Count of ghosts in the set
   * @returns {number} Points gained
   */
  static calculate(targetRegion, dist, jakubRange, gCount) {
    if (gCount <= 0) return 0;
    
    const distToEdge = Math.min(
      targetRegion.x, 
      5 - targetRegion.x, 
      targetRegion.y, 
      5 - targetRegion.y
    );
    
    let perPawn = 2 - distToEdge;
    if (dist <= jakubRange) {
      perPawn -= 1;
    }
    
    return Math.max(0, perPawn) * gCount;
  }

  /**
   * Searches for the best place to put a set for the Ghost race.
   */
  static findBestPlacement(regions, emptyRegions, placeableSets, calculatePlacementPoints) {
    let best = null;
    placeableSets.forEach(set => {
      emptyRegions.forEach(region => {
        const placementScores = calculatePlacementPoints(regions, region, set.content);
        const pts = placementScores.ghost || 0;
        const currentDist = region.jakubDistance || 0;

        if (!best) {
          best = { set, region, pts, allScores: placementScores };
        } else {
          const bestDist = best.region.jakubDistance || 0;
          if (pts > best.pts) {
            best = { set, region, pts, allScores: placementScores };
          } else if (pts === best.pts && currentDist > bestDist) {
            best = { set, region, pts, allScores: placementScores };
          }
        }
      });
    });
    return best;
  }
}
