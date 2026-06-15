import { VampireScoring } from './vampireScoring.js';
import { WerewolfScoring } from './werewolfScoring.js';
import { GhostScoring } from './ghostScoring.js';
import { BardakScoring } from './bardakScoring.js';

export class Scoring {
  /**
   * Calculates Chebyshev distance between two regions.
   * @param {Object} r1 - Region 1
   * @param {Object} r2 - Region 2
   * @returns {number} Distance
   */
  static getChebyshevDistance(r1, r2) {
    if (!r1 || !r2) return 999;
    return Math.max(Math.abs(r1.x - r2.x), Math.abs(r1.y - r2.y));
  }

  static calculatePlacementPoints(regions, targetRegion, setContent) {
    if (!regions || !targetRegion) return { V: 0, W: 0, G: 0, B: 0 };
    const jakubRegion = regions.find(r => r && r.pawns && r.pawns.jakub?.length > 0);
    const dist = targetRegion.jakubDistance !== undefined 
      ? targetRegion.jakubDistance 
      : Scoring.getChebyshevDistance(targetRegion, jakubRegion);
    
    const jakub = jakubRegion?.pawns?.jakub?.[0];
    const jakubRange = jakub ? (jakub.range !== undefined ? Math.max(1, jakub.range) : 1) : 0;

    const content = setContent || {};

    return {
      V: VampireScoring.calculate(dist, content.vampire || 0),
      W: WerewolfScoring.calculate(regions, targetRegion, dist, content.werewolf || 0),
      G: GhostScoring.calculate(targetRegion, dist, jakubRange, content.ghost || 0),
      B: BardakScoring.calculate(dist, content.bardak || 0)
    };
  }
}
