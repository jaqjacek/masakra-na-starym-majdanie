import { VampireScoring } from './vampireScoring.js';
import { WerewolfScoring } from './werewolfScoring.js';
import { GhostScoring } from './ghostScoring.js';
import { BardakScoring } from './bardakScoring.js';
import { DEFAULT_JAKUB_DISTANCE } from '../constants.js';
import { chebyshevDistance } from '../boardGeometry.js';

export class Scoring {
  static getChebyshevDistance(r1, r2) {
    return chebyshevDistance(r1, r2);
  }

  static calculatePlacementPoints(regions, targetRegion, setContent) {
    if (!regions || !targetRegion) return { V: 0, W: 0, G: 0, B: 0 };
    const jakubRegion = regions.find(r => r && r.pawns && r.pawns.jakub?.length > 0);
    const dist = jakubRegion
      ? Scoring.getChebyshevDistance(targetRegion, jakubRegion)
      : (targetRegion.jakubDistance !== undefined ? targetRegion.jakubDistance : DEFAULT_JAKUB_DISTANCE);

    const content = setContent || {};

    return {
      V: VampireScoring.calculate(dist, content.vampire || 0),
      W: WerewolfScoring.calculate(regions, targetRegion, dist, content.werewolf || 0),
      G: GhostScoring.calculate(targetRegion, dist, content.ghost || 0),
      B: BardakScoring.calculate(dist, content.bardak || 0)
    };
  }
}
