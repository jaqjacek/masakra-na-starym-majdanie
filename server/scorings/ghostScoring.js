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
  static findBestPlacement(regions, emptyRegions, heldSets, globalPawnPool, currentOnBoard, playLimits, calculatePlacementPoints) {
    let best = null;
    heldSets.forEach(set => {
      let isPlaceable = true;
      Object.entries(set.content).forEach(([tId, count]) => {
        const remainingGlobal = globalPawnPool[tId] - currentOnBoard[tId];
        const remainingPlay = playLimits[tId] - currentOnBoard[tId];
        if (remainingGlobal < count || remainingPlay < count) isPlaceable = false;
      });
      if (!isPlaceable) return;

      emptyRegions.forEach(region => {
        const placementScores = calculatePlacementPoints(regions, region, set.content);
        const pts = placementScores.ghost || 0;
        if (!best || pts > best.pts) {
          best = { set, region, pts, allScores: placementScores };
        }
      });
    });
    return best;
  }
}
