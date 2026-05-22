import { Board } from '../constants/board';
import { 
  VAMPIRE_SCORING_RANGE, 
  WEREWOLF_SCORING_DIVISOR, 
  BOARD_SIZE, 
  GHOST_SCORING_BASE 
} from '../constants/constants';

export class Scoring {
  /**
   * Calculates points for each race in a set when placed in a target region.
   * @param {Array} regions - All board regions
   * @param {Object} targetRegion - The region where the set is placed
   * @param {Object} setContent - The content of the set {vampire: X, werewolf: Y, ...}
   * @returns {Object} Points per race {vampire: A, werewolf: B, ghost: C, bardak: D}
   */
  static calculatePlacementPoints(regions, targetRegion, setContent) {
    const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
    const dist = targetRegion.jakubDistance !== undefined 
      ? targetRegion.jakubDistance 
      : Board.getDistance(targetRegion, jakubRegion);
    const jakub = jakubRegion?.pawns.jakub[0];
    const jakubRange = jakub ? jakub.range : 0;

    const points = {
      vampire: 0,
      werewolf: 0,
      ghost: 0,
      bardak: 0
    };

    // 1. Vampire Scoring
    const vCount = setContent.vampire || 0;
    if (vCount > 0) {
      points.vampire = Math.max(0, VAMPIRE_SCORING_RANGE - dist) * vCount;
    }

    // 2. Werewolf Scoring
    const wCount = setContent.werewolf || 0;
    if (wCount > 0) {
      let totalW = wCount;
      totalW += (targetRegion.pawns?.werewolf?.length || 0);
      targetRegion.neighbors.forEach(nIdx => {
        const neighbor = regions[nIdx];
        if (neighbor) totalW += (neighbor.pawns?.werewolf?.length || 0);
      });
      points.werewolf = Math.floor(totalW / WEREWOLF_SCORING_DIVISOR) + 1;
      if (dist <= 1) points.werewolf += 1;
    }

    // 3. Ghost Scoring
    const gCount = setContent.ghost || 0;
    if (gCount > 0) {
      const edgeCoord = BOARD_SIZE - 1;
      const distToEdge = Math.min(targetRegion.x, edgeCoord - targetRegion.x, targetRegion.y, edgeCoord - targetRegion.y);
      let perPawn = GHOST_SCORING_BASE - distToEdge;
      if (dist <= jakubRange) perPawn -= 1;
      points.ghost = Math.max(0, perPawn) * gCount;
    }

    // 4. Bardak Scoring
    const bCount = setContent.bardak || 0;
    if (bCount > 0) {
      points.bardak = (dist <= 1) ? 0 : bCount;
    }

    return points;
  }
}
