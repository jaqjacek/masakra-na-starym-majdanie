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
    const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
    const dist = targetRegion.jakubDistance !== undefined 
      ? targetRegion.jakubDistance 
      : Scoring.getChebyshevDistance(targetRegion, jakubRegion);
    
    const jakub = jakubRegion?.pawns.jakub[0];
    const jakubRange = jakub ? (jakub.range !== undefined ? Math.max(1, jakub.range) : 1) : 0;

    return {
      V: VampireScoring.calculate(dist, setContent.vampire || 0),
      W: WerewolfScoring.calculate(regions, targetRegion, dist, setContent.werewolf || 0),
      G: GhostScoring.calculate(targetRegion, dist, jakubRange, setContent.ghost || 0),
      B: BardakScoring.calculate(dist, setContent.bardak || 0)
    };
  }
}
