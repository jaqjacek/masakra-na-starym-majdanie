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
    const x1 = r1.x !== undefined ? r1.x : (r1.id !== undefined ? r1.id % 6 : 0);
    const y1 = r1.y !== undefined ? r1.y : (r1.id !== undefined ? Math.floor(r1.id / 6) : 0);
    const x2 = r2.x !== undefined ? r2.x : (r2.id !== undefined ? r2.id % 6 : 0);
    const y2 = r2.y !== undefined ? r2.y : (r2.id !== undefined ? Math.floor(r2.id / 6) : 0);
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
  }

  static calculatePlacementPoints(regions, targetRegion, setContent) {
    if (!regions || !targetRegion) return { V: 0, W: 0, G: 0, B: 0 };
    const jakubRegion = regions.find(r => r && r.pawns && r.pawns.jakub?.length > 0);
    // If Jakub is on board, always compute live distance to current Jakub position.
    // Fall back to targetRegion.jakubDistance (e.g. for mock test fixtures without Jakub pawn).
    const dist = jakubRegion 
      ? Scoring.getChebyshevDistance(targetRegion, jakubRegion)
      : (targetRegion.jakubDistance !== undefined ? targetRegion.jakubDistance : 3);
    
    const jakub = jakubRegion?.pawns?.jakub?.[0];
    const jakubRange = jakub ? (jakub.range !== undefined ? Math.max(1, jakub.range) : 1) : 1;

    const content = setContent || {};

    return {
      V: VampireScoring.calculate(dist, content.vampire || 0),
      W: WerewolfScoring.calculate(regions, targetRegion, dist, content.werewolf || 0),
      G: GhostScoring.calculate(targetRegion, dist, jakubRange, content.ghost || 0),
      B: BardakScoring.calculate(dist, content.bardak || 0)
    };
  }
}
