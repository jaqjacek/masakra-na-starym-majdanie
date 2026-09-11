import { SharedPlacementManager } from '../../shared/sharedPlacementManager.js';
import { RACES, RACE_TO_ABBR } from '../../shared/constants.js';
import { trackPointsChange } from '../../shared/statsManager.js';

export class ClientPlacementManager {
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

    const playerGains = {};
    workState.players.forEach(p => {
      if (p.generalOf) {
        const abbr = RACE_TO_ABBR[p.generalOf];
        const racePts = best.allScores[abbr] || 0;
        if (racePts !== 0) {
          p.points += racePts;
          trackPointsChange(p, p.generalOf, racePts, 'rambo');
          playerGains[p.generalOf] = racePts;
        }
      }
    });

    const RACES_ORDER = ['vampire', 'werewolf', 'ghost', 'bardak'];
    const logSummary = [];
    RACES_ORDER.forEach(race => {
      if (playerGains[race] !== undefined) {
        const racePts = playerGains[race];
        const abbr = RACE_TO_ABBR[race];
        const sign = racePts > 0 ? '+' : '';
        logSummary.push(`${abbr}:${sign}${racePts}`);
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
    let idx = (workState.sets.drawPile || []).findIndex(s => String(s.id) === String(usedSetId));
    if (idx !== -1) {
      usedSet = workState.sets.drawPile.splice(idx, 1)[0];
    } else {
      idx = (workState.sets.heldSets || []).findIndex(s => String(s.id) === String(usedSetId));
      if (idx !== -1) {
        usedSet = workState.sets.heldSets.splice(idx, 1)[0];
      } else {
        idx = (workState.sets.discardPile || []).findIndex(s => String(s.id) === String(usedSetId));
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

  static executePass(curPlayer, workState, applySetToJakubAnger) {
    if (!workState.passedPlayers.includes(curPlayer.id)) {
      workState.passedPlayers.push(curPlayer.id);
    }
    
    let jakub = null;
    for (const r of workState.regions) {
      if (r.pawns.jakub?.length > 0) {
        jakub = r.pawns.jakub[0];
        break;
      }
    }

    const currentHand = (workState.sets.heldSets || []).filter(s => String(s.ownerId) === String(curPlayer.id));
    const toSell = currentHand.filter(s => 
      (s.content[curPlayer.generalOf] || 0) === 0 &&
      SharedPlacementManager.isSetAllowedToPass(s, workState.regions, jakub)
    );

    toSell.forEach(s => {
      const idx = workState.sets.heldSets.findIndex(h => String(h.id) === String(s.id));
      if (idx !== -1) {
        workState.sets.heldSets[idx].ownerId = 'jakub';
        if (jakub && applySetToJakubAnger) {
          const result = applySetToJakubAnger(jakub, s.content);
          jakub.anger = result.anger;
          jakub.range = result.range;
        }
      }
    });

    curPlayer.points += toSell.length;
    if (toSell.length > 0) {
      trackPointsChange(curPlayer, curPlayer.generalOf, toSell.length, 'passing');
    }
    return toSell.length;
  }
}
