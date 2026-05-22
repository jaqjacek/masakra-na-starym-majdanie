import { VampireScoring } from './scorings/vampireScoring.js';
import { WerewolfScoring } from './scorings/werewolfScoring.js';
import { GhostScoring } from './scorings/ghostScoring.js';
import { BardakScoring } from './scorings/bardakScoring.js';

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

  /**
   * Server-side placement scoring logic, delegating to specialized scorers.
   * @param {Array} regions - All board regions
   * @param {Object} targetRegion - The region where the set is placed
   * @param {Object} setContent - The content of the set {vampire: X, werewolf: Y, ...}
   * @returns {Object} Points per race
   */
  static calculatePlacementPoints(regions, targetRegion, setContent) {
    const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
    const dist = this.getChebyshevDistance(targetRegion, jakubRegion);
    const jakub = jakubRegion?.pawns.jakub[0];
    const jakubRange = jakub ? jakub.range : 0;

    return {
      vampire: VampireScoring.calculate(dist, setContent.vampire || 0),
      werewolf: WerewolfScoring.calculate(regions, targetRegion, dist, setContent.werewolf || 0),
      ghost: GhostScoring.calculate(targetRegion, dist, jakubRange, setContent.ghost || 0),
      bardak: BardakScoring.calculate(dist, setContent.bardak || 0)
    };
  }
}
