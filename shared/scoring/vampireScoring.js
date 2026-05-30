import { WerewolfScoring } from './werewolfScoring.js';
import { GhostScoring } from './ghostScoring.js';
import { BardakScoring } from './bardakScoring.js';

export class VampireScoring {
  /**
   * Calculates points for Vampire placement based on distance to Jakub.
   * @param {number} dist - Chebyshev distance to Jakub
   * @param {number} vCount - Count of vampires in the set
   * @returns {number} Points gained
   */
  static calculate(dist, vCount) {
    if (vCount <= 0) return 0;
    return (4 - dist) * vCount;
  }

  static findBestPlacement(regions, emptyRegions, placeableSets) {
    let best = null;
    const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
    const jakub = jakubRegion?.pawns.jakub[0];
    const jakubRange = jakub ? jakub.range : 0;

    placeableSets.forEach(set => {
      emptyRegions.forEach(region => {
        const dist = region.jakubDistance;
        const vPts = VampireScoring.calculate(dist, set.content.vampire || 0);
        const wPts = WerewolfScoring.calculate(regions, region, dist, set.content.werewolf || 0);
        const gPts = GhostScoring.calculate(region, dist, jakubRange, set.content.ghost || 0);
        const bPts = BardakScoring.calculate(dist, set.content.bardak || 0);

        const netScore = vPts - (wPts + gPts + bPts);

        if (!best) {
          best = { set, region, pts: vPts, netScore };
        } else {
          if (netScore > best.netScore) {
            best = { set, region, pts: vPts, netScore };
          } else if (netScore === best.netScore && vPts > best.pts) {
            best = { set, region, pts: vPts, netScore };
          }
        }
      });
    });
    return best;
  }

  static calculateFinal(regions) {
    let regionsWithVampires = 0;
    regions.forEach(r => {
      if (r.pawns?.vampire?.length > 0 || r.pawns?.V?.length > 0) {
        regionsWithVampires++;
      }
    });
    return regionsWithVampires * 2;
  }
}
