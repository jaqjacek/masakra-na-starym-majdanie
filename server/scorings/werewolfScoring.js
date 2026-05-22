export class WerewolfScoring {
  /**
   * Calculates points for Werewolf placement based on neighbors and distance to Jakub.
   * @param {Array} regions - All board regions
   * @param {Object} targetRegion - Region where the set is placed
   * @param {number} dist - Chebyshev distance to Jakub
   * @param {number} wCount - Count of werewolves in the set
   * @returns {number} Points gained
   */
  static calculate(regions, targetRegion, dist, wCount) {
    if (wCount <= 0) return 0;
    
    let totalW = wCount;
    totalW += (targetRegion.pawns?.werewolf?.length || 0);
    
    targetRegion.neighbors.forEach(nIdx => {
      const neighbor = regions[nIdx];
      if (neighbor) {
        totalW += (neighbor.pawns?.werewolf?.length || 0);
      }
    });
    
    let pts = Math.floor(totalW / 3) + 1;
    if (dist <= 1) {
      pts += 1;
    }
    
    return pts;
  }
}
