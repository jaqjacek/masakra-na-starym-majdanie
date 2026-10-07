import { SharedPlacementManager } from '../../shared/sharedPlacementManager.js';
import { Scoring } from '../../shared/scoring/scoring.js';
import { RACES, RACE_TO_ABBR } from '../../shared/constants.js';

export class ServerPlacementManager {
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
  static findBestPlacement(regions, heldSets, playerId, generalOf, globalPawnPool, playLimits, currentRound = 1) {
    return SharedPlacementManager.findBestPlacement(regions, heldSets, playerId, generalOf, globalPawnPool, playLimits, currentRound);
  }

  /**
   * Executes the placement of the chosen set on the target region and awards points.
   * @param {Object} best - The best placement config returned from findBestPlacement
   * @param {Array} regions - All regions on the board
   * @param {Array} players - All players in the session
   * @param {Array} heldSets - The sets pool held list
   * @param {Array} discardPile - The sets pool discard list
   * @returns {Array} Point gains log summary
   */
  static executePlacement(best, regions, players, heldSets, discardPile) {
    const targetRegion = regions.find(r => r.id === best.region.id);
    
    // Place pawns onto the target region
    Object.entries(best.set.content).forEach(([tId, count]) => {
      if (!targetRegion.pawns[tId]) {
        targetRegion.pawns[tId] = [];
      }
      for (let i = 0; i < count; i++) {
        targetRegion.pawns[tId].push({ statuses: ['ENABLED'] });
      }
    });

    // Update player scores based on general points
    const pointGains = [];
    players.forEach(beneficiary => {
      if (beneficiary.generalOf) {
        const abbr = RACE_TO_ABBR[beneficiary.generalOf];
        const gain = best.allScores[abbr] || 0;
        beneficiary.points += gain;
        if (gain !== 0) {
          pointGains.push({ player: beneficiary.name, race: beneficiary.generalOf, points: gain });
        }
      }
    });

    // Discard the used set
    const idx = heldSets.findIndex(s => s.id === best.set.id);
    if (idx !== -1) {
      const used = heldSets.splice(idx, 1)[0];
      used.ownerId = null;
      discardPile.push(used);
    }

    return pointGains;
  }

  /**
   * Handles a player's turn pass: randomly keep at most MAX_SETS_KEPT_ON_PASS,
   * tip excess sets to Jakub with no points.
   * @param {Object} player - The active player passing
   * @param {Array} heldSets - The sets currently held in the pool
   * @returns {number} Count of excess sets tipped to Jakub
   */
  static executePass(player, heldSets, _regions) {
    const myHeld = heldSets.filter(s => s.ownerId !== null && s.ownerId !== undefined && String(s.ownerId) === String(player.id));
    const toDiscard = SharedPlacementManager.selectExcessSetsOnPass(myHeld);

    toDiscard.forEach(s => {
      s.ownerId = 'jakub';
    });

    return toDiscard.length;
  }
}
