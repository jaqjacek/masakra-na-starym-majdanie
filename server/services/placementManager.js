import { Scoring } from '../scoring.js';
import { RACES } from '../constants.js';

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
    const myHeld = heldSets.filter(s => s.ownerId === playerId);
    const emptyR = regions.filter(r => !RACES.some(race => r.pawns[race]?.length > 0));
    
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

    let best = null;

    myHeld.forEach(set => {
      // Check if placing this set violates global limits or play limits
      let isPlaceable = true;
      Object.entries(set.content).forEach(([tId, count]) => {
        const remainingGlobal = globalPawnPool[tId] - currentOnBoard[tId];
        const remainingPlay = playLimits[tId] - currentOnBoard[tId];
        if (remainingGlobal < count || remainingPlay < count) {
          isPlaceable = false;
        }
      });

      if (!isPlaceable) return;

      // Find the region that scores the highest for our general race
      emptyR.forEach(region => {
        const placementScores = Scoring.calculatePlacementPoints(regions, region, set.content);
        const pts = placementScores[generalOf] || 0;
        if (!best || pts > best.pts) {
          best = { set, region, pts, allScores: placementScores };
        }
      });
    });

    return best;
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
        const gain = best.allScores[beneficiary.generalOf] || 0;
        beneficiary.points += gain;
        if (gain > 0) {
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
   * Handles a player's turn pass, discarding/selling excess sets to Jakub and updating scores.
   * @param {Object} player - The active player passing
   * @param {Array} heldSets - The sets currently held in the pool
   * @param {number} maxHandSize - Maximum hand size allowed (e.g. 3)
   * @returns {number} Count of excess sets sold
   */
  static executePass(player, heldSets, maxHandSize) {
    const myHeld = heldSets.filter(s => s.ownerId === player.id);
    if (myHeld.length > maxHandSize) {
      const excess = myHeld.length - maxHandSize;
      
      // Discard sets that give the least power or count for player's general
      const sorted = [...myHeld].sort((a, b) => {
        const countA = a.content[player.generalOf] || 0;
        const countB = b.content[player.generalOf] || 0;
        return countA - countB;
      });

      for (let i = 0; i < excess; i++) {
        const set = sorted[i];
        const match = heldSets.find(s => s.id === set.id);
        if (match) {
          match.ownerId = 'jakub';
        }
      }

      player.points += excess;
      return excess;
    }
    return 0;
  }
}
