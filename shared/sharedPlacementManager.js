import { Scoring } from './scoring/scoring.js';
import { RACES, DEFAULT_JAKUB_DISTANCE, regionXY, MAX_SETS_KEPT_ON_PASS } from './constants.js';
import { VampireScoring } from './scoring/vampireScoring.js';
import { WerewolfScoring } from './scoring/werewolfScoring.js';
import { GhostScoring } from './scoring/ghostScoring.js';
import { BardakScoring } from './scoring/bardakScoring.js';

export class SharedPlacementManager {
  /**
   * When passing with more than maxKeep sets, randomly choose which excess sets to tip to Jakub.
   * @returns {Array} sets that should be discarded (owner becomes jakub); kept sets stay in hand
   */
  static selectExcessSetsOnPass(myHeld, maxKeep = MAX_SETS_KEPT_ON_PASS) {
    if (!myHeld || myHeld.length <= maxKeep) return [];
    const shuffled = [...myHeld];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(maxKeep);
  }

  /**
   * Helper to check if a set can be sold/passed to Jakub based on the majority anger vs board count rule.
   */
  static isSetAllowedToPass(set, regions, jakub) {
    if (!jakub) return true;
    const racesInSet = Object.keys(set.content).filter(race => set.content[race] > 0);
    if (racesInSet.length === 0) return true;

    // Count pawns on board for each race
    const pawnsOnBoard = { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 };
    regions.forEach(region => {
      ['vampire', 'werewolf', 'ghost', 'bardak'].forEach(race => {
        pawnsOnBoard[race] += region.pawns[race]?.length || 0;
      });
    });

    let conditionsMet = 0;
    racesInSet.forEach(race => {
      const anger = jakub.anger[race] || 0;
      const countOnBoard = pawnsOnBoard[race] || 0;
      if (anger > countOnBoard) {
        conditionsMet++;
      }
    });

    // If strictly greater than half, it is NOT allowed
    const threshold = racesInSet.length / 2;
    if (conditionsMet > threshold) {
      return false;
    }
    return true;
  }

  /**
   * Scans a player's held sets and empty board regions to find the best placeable set-region combination.
   * @param {Array} regions - All regions on the board
   * @param {Array} heldSets - The sets currently held in the pool
   * @param {number} playerId - The active player's ID
   * @param {string} generalOf - The active player's assigned General race
   * @param {Object} globalPawnPool - The total pawn pool configuration
   * @param {Object} playLimits - The pawn limits in play configuration
   * @param {number} [_currentRound=1] - The current round number (reserved for future round-aware scoring)
   * @returns {Object|null} The best placement description or null
   */
  static findBestPlacement(regions, heldSets, playerId, generalOf, globalPawnPool, playLimits, _currentRound = 1) {
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

    const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
    const jakub = jakubRegion?.pawns.jakub[0];
    const jakubRange = jakub ? (jakub.range !== undefined ? Math.max(1, jakub.range) : 1) : 0;

    let best = null;
    let bestStrategicScore = -Infinity;

    placeableSets.forEach(set => {
      emptyRegions.forEach(region => {
        const dist = jakubRegion
          ? Math.max(
              Math.abs(regionXY(region).x - regionXY(jakubRegion).x),
              Math.abs(regionXY(region).y - regionXY(jakubRegion).y)
            )
          : (region.jakubDistance !== undefined ? region.jakubDistance : DEFAULT_JAKUB_DISTANCE);

        // 1. Calculate points for each race
        const vPts = VampireScoring.calculate(dist, set.content.vampire || 0);
        const wPts = WerewolfScoring.calculate(regions, region, dist, set.content.werewolf || 0);
        const gPts = GhostScoring.calculate(region, dist, set.content.ghost || 0);
        const bPts = BardakScoring.calculate(dist, set.content.bardak || 0);

        let ourPts = 0;
        let opponentsPts = 0;

        if (generalOf === 'vampire') {
          ourPts = vPts;
          opponentsPts = wPts + gPts + bPts;
        } else if (generalOf === 'werewolf') {
          ourPts = wPts;
          opponentsPts = vPts + gPts + bPts;
        } else if (generalOf === 'ghost') {
          ourPts = gPts;
          opponentsPts = vPts + wPts + bPts;
        } else if (generalOf === 'bardak') {
          ourPts = bPts;
          opponentsPts = vPts + wPts + gPts;
        }

        const netScore = ourPts - opponentsPts;

        // 2. Jakub Threat Avoidance
        let threatPenalty = 0;
        const ourPawnCountInSet = set.content[generalOf] || 0;
        if (ourPawnCountInSet > 0 && jakub && (jakub.anger[generalOf] || 0) > 0) {
          if (dist <= jakubRange) {
            threatPenalty += (jakub.anger[generalOf] || 0) * ourPawnCountInSet * 1.5;
          } else if (dist <= jakubRange + 1) {
            threatPenalty += (jakub.anger[generalOf] || 0) * ourPawnCountInSet * 0.5;
          }
        }

        // 3. End-Game Alignment
        let endGameBonus = 0;
        if (ourPawnCountInSet > 0) {
          if (generalOf === 'vampire') {
            endGameBonus += 2.0; // Spreading to a new region
          } else if (generalOf === 'ghost') {
            const otherPawnsInSet = (set.content.vampire || 0) + (set.content.werewolf || 0) + (set.content.bardak || 0);
            if (otherPawnsInSet === 0) {
              endGameBonus += 2.0; // Solo region
            } else if (ourPawnCountInSet > otherPawnsInSet) {
              endGameBonus += 1.0; // Majority
            }
          } else if (generalOf === 'bardak') {
            const otherPawnsInSet = (set.content.vampire || 0) + (set.content.werewolf || 0) + (set.content.ghost || 0);
            if (ourPawnCountInSet > otherPawnsInSet) {
              endGameBonus += 1.0; // Majority
            }
          } else if (generalOf === 'werewolf') {
            endGameBonus += ourPawnCountInSet * 0.5; // Count volume
          }
        }

        const strategicScore = netScore - threatPenalty + endGameBonus;

        if (strategicScore > bestStrategicScore) {
          bestStrategicScore = strategicScore;
          best = {
            set,
            region,
            pts: ourPts,
            netScore,
            strategicScore,
            opponentsPts
          };
        }
      });
    });

    if (best) {
      best.allScores = Scoring.calculatePlacementPoints(regions, best.region, best.set.content);

      // Check if we have any placeable sets containing our own general's pawns
      const hasOwnPawnsInHand = placeableSets.some(s => (s.content[generalOf] || 0) > 0);

      // Passing trims excess hand to Jakub with no points — only skip a weak placement
      // when it is clearly worse than doing nothing (negative place utility).
      const pointsFromPlace = best.pts || 0;
      const ownPawnsCount = best.set.content[generalOf] || 0;
      const netScore = best.netScore || 0;
      const utilityPlace = pointsFromPlace + ownPawnsCount + Math.min(0, netScore) * 0.5;

      if (utilityPlace < 0) {
        if (!hasOwnPawnsInHand) {
          const opponentsPoints = Object.entries(best.allScores || {}).reduce((sum, [race, pts]) => {
            if (race !== generalOf) {
              sum += pts;
            }
            return sum;
          }, 0);

          if (opponentsPoints <= 0) {
            return best;
          }
        }
        return null;
      }
    }
    return best;
  }
}
