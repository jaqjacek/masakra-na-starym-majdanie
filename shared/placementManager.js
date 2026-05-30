import { Scoring } from './scoring/scoring.js';
import { RACES } from './constants.js';
import { VampireScoring } from './scoring/vampireScoring.js';
import { WerewolfScoring } from './scoring/werewolfScoring.js';
import { GhostScoring } from './scoring/ghostScoring.js';
import { BardakScoring } from './scoring/bardakScoring.js';

export class PlacementManager {
  /**
   * Scans a player's held sets and empty board regions to find the best placeable set-region combination.
   * @param {Array} regions - All regions on the board
   * @param {Array} heldSets - The sets currently held in the pool
   * @param {number} playerId - The active player's ID
   * @param {string} generalOf - The active player's assigned General race
   * @param {Object} globalPawnPool - The total pawn pool configuration
   * @param {Object} playLimits - The pawn limits in play configuration
   * @returns {Object|null} The best placement description or null
   */
  static findBestPlacement(regions, heldSets, playerId, generalOf, globalPawnPool, playLimits) {
    const myHeld = heldSets.filter(s => s.ownerId !== null && s.ownerId !== undefined && String(s.ownerId) === String(playerId));
    const emptyRegions = regions.filter(r => !RACES.some(race => r.pawns[race]?.length > 0));
    
    // Count current pawns in play on the entire board
    const currentOnBoard = {};
    RACES.forEach(r => currentOnBoard[r] = 0);
    regions.forEach(r => {
      Object.entries(r.pawns).forEach(([tId, insts]) => {
        if (currentOnBoard[tId] !== undefined) {
          currentOnBoard[tId] += insts.length;
        }
      });
    });

    // Filter heldSets to sets that can be put on board (pawns are within globalPawnPool and play limits)
    const placeableSets = myHeld.filter(set => {
      let isPlaceable = true;
      Object.entries(set.content).forEach(([tId, count]) => {
        const remainingGlobal = globalPawnPool[tId] - currentOnBoard[tId];
        const remainingPlay = playLimits[tId] - currentOnBoard[tId];
        if (remainingGlobal < count || remainingPlay < count) {
          isPlaceable = false;
        }
      });
      return isPlaceable;
    });

    let best = null;
    if (generalOf === 'vampire') {
      best = VampireScoring.findBestPlacement(regions, emptyRegions, placeableSets);
    } else if (generalOf === 'werewolf') {
      best = WerewolfScoring.findBestPlacement(regions, emptyRegions, placeableSets);
    } else if (generalOf === 'ghost') {
      best = GhostScoring.findBestPlacement(regions, emptyRegions, placeableSets);
    } else if (generalOf === 'bardak') {
      best = BardakScoring.findBestPlacement(regions, emptyRegions, placeableSets);
    }

    if (best) {
      best.allScores = Scoring.calculatePlacementPoints(regions, best.region, best.set.content);
    }
    return best;
  }
}
