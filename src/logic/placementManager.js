import { Scoring } from './Scoring';
import { RACES } from '../constants/game';

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
   * @param {Object} workState - The mutable work game state
   * @param {Array} PAWN_TYPES - The pawn type configurations
   * @param {Object} playLimits - The pawn play limits
   * @returns {Object} { logSummaryString, statusLogString }
   */
  static executePlacement(best, workState, PAWN_TYPES, playLimits) {
    const targetRegion = workState.regions[best.region.id];
    
    // Place pawns onto the target region
    Object.entries(best.set.content).forEach(([tId, count]) => {
      if (!targetRegion.pawns[tId]) {
        targetRegion.pawns[tId] = [];
      }
      for (let i = 0; i < count; i++) {
        const pawnType = PAWN_TYPES.find(p => p.id === tId);
        targetRegion.pawns[tId].push({ 
          statuses: [...pawnType.defaultStatuses], 
          ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) 
        });
      }
    });

    // Update player scores based on general points
    const logSummary = [];
    workState.players.forEach(p => {
      if (p.generalOf) {
        const racePts = best.allScores[p.generalOf] || 0;
        if (racePts > 0) {
          p.points += racePts;
          logSummary.push(`${p.generalOf[0].toUpperCase()}:+${racePts}`);
        }
      }
    });

    // Build status log
    const statusLog = RACES.map(race => {
      const count = workState.regions.reduce((sum, r) => sum + (r.pawns[race]?.length || 0), 0);
      const limit = playLimits[race];
      return `${race[0].toUpperCase()}:${count}/${limit}`;
    }).join(' ');

    // Discard the used set
    const usedSetId = best.set.id;
    let usedSet = null;
    let idx = (workState.sets.drawPile || []).findIndex(s => s.id == usedSetId);
    if (idx !== -1) {
      usedSet = workState.sets.drawPile.splice(idx, 1)[0];
    } else {
      idx = (workState.sets.heldSets || []).findIndex(s => s.id == usedSetId);
      if (idx !== -1) {
        usedSet = workState.sets.heldSets.splice(idx, 1)[0];
      } else {
        idx = (workState.sets.discardPile || []).findIndex(s => s.id == usedSetId);
        if (idx !== -1) {
          usedSet = workState.sets.discardPile.splice(idx, 1)[0];
        }
      }
    }

    if (usedSet) {
      usedSet.ownerId = null;
      usedSet.used = false;
      if (!workState.sets.discardPile) {
        workState.sets.discardPile = [];
      }
      workState.sets.discardPile.push(usedSet);
    }

    return {
      logSummaryString: logSummary.join(', '),
      statusLogString: statusLog
    };
  }

  /**
   * Handles a player's turn pass, discarding/selling excess sets to Jakub and updating scores.
   * @param {Object} curPlayer - The active player passing
   * @param {Object} workState - The mutable work game state
   * @param {number} maxHandSize - Maximum hand size allowed
   * @param {Function} applySetToJakubAnger - Function to apply a set to Jakub's anger
   * @returns {number} Count of excess sets sold
   */
  static executePass(curPlayer, workState, maxHandSize, applySetToJakubAnger) {
    workState.passedPlayers.push(curPlayer.id);
    const currentHand = (workState.sets.heldSets || []).filter(s => s.ownerId === curPlayer.id);
    if (currentHand.length > maxHandSize) {
      const excessCount = currentHand.length - maxHandSize;
      const sorted = [...currentHand].sort((a, b) => (a.content[curPlayer.generalOf] || 0) - (b.content[curPlayer.generalOf] || 0));
      const toDiscard = sorted.slice(0, excessCount);
      
      let jakub = null;
      for (const r of workState.regions) {
        if (r.pawns.jakub?.length > 0) {
          jakub = r.pawns.jakub[0];
          break;
        }
      }

      toDiscard.forEach(s => {
        const idx = workState.sets.heldSets.findIndex(h => h.id === s.id);
        if (idx !== -1) {
          workState.sets.heldSets[idx].ownerId = 'jakub';
          if (jakub && applySetToJakubAnger) {
            const result = applySetToJakubAnger(jakub, s.content);
            jakub.anger = result.anger;
            jakub.range = result.range;
          }
        }
      });
      curPlayer.points += excessCount;
      return excessCount;
    }
    return 0;
  }
}
