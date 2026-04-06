export class Scoring {
  static getChebyshevDistance(r1, r2) {
    if (!r1 || !r2) return 999;
    return Math.max(Math.abs(r1.x - r2.x), Math.abs(r1.y - r2.y));
  }

  /**
   * Server-side placement scoring logic.
   * @param {Array} regions 
   * @param {Object} targetRegion 
   * @param {Object} setContent 
   * @returns {Object} Points per race
   */
  static calculatePlacementPoints(regions, targetRegion, setContent) {
    const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
    const dist = this.getChebyshevDistance(targetRegion, jakubRegion);
    const jakub = jakubRegion?.pawns.jakub[0];
    const jakubRange = jakub ? jakub.range : 0;

    const points = { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 };

    // 1. Vampire
    const vCount = setContent.vampire || 0;
    if (vCount > 0) points.vampire = Math.max(0, 4 - dist) * vCount;

    // 2. Werewolf
    const wCount = setContent.werewolf || 0;
    if (wCount > 0) {
      let totalW = wCount;
      totalW += (targetRegion.pawns?.werewolf?.length || 0);
      targetRegion.neighbors.forEach(nIdx => {
        const neighbor = regions[nIdx];
        if (neighbor) totalW += (neighbor.pawns?.werewolf?.length || 0);
      });
      points.werewolf = Math.floor(totalW / 3) + 1;
      if (dist <= 1) points.werewolf += 1;
    }

    // 3. Ghost
    const gCount = setContent.ghost || 0;
    if (gCount > 0) {
      const distToEdge = Math.min(targetRegion.x, 4 - targetRegion.x, targetRegion.y, 4 - targetRegion.y);
      let perPawn = 2 - distToEdge;
      if (dist <= jakubRange) perPawn -= 1;
      points.ghost = Math.max(0, perPawn) * gCount;
    }

    // 4. Bardak
    const bCount = setContent.bardak || 0;
    if (bCount > 0) points.bardak = (dist <= 1) ? 0 : bCount;

    return points;
  }
}
