import { Scoring } from './scoring/scoring.js';
import { RACES } from './constants.js';
import { VampireScoring } from './scoring/vampireScoring.js';
import { WerewolfScoring } from './scoring/werewolfScoring.js';
import { GhostScoring } from './scoring/ghostScoring.js';
import { BardakScoring } from './scoring/bardakScoring.js';

export class SharedPlacementManager {
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
   * @param {number} [currentRound=1] - The current round number
   * @returns {Object|null} The best placement description or null
   */
  static findBestPlacement(regions, heldSets, playerId, generalOf, globalPawnPool, playLimits, currentRound = 1) {
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
        const dist = region.jakubDistance;

        // 1. Calculate points for each race
        const vPts = VampireScoring.calculate(dist, set.content.vampire || 0);
        const wPts = WerewolfScoring.calculate(regions, region, dist, set.content.werewolf || 0);
        const gPts = GhostScoring.calculate(region, dist, jakubRange, set.content.ghost || 0);
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

      // Compare utility of placing vs passing
      const toSell = myHeld.filter(s => 
        (s.content[generalOf] || 0) === 0 && 
        SharedPlacementManager.isSetAllowedToPass(s, regions, jakub)
      );
      const pointsFromPass = toSell.length;
      
      const pointsFromPlace = best.pts || 0;
      const ownPawnsCount = best.set.content[generalOf] || 0;
      const netScore = best.netScore || 0;

      // Place utility = immediate points + end-game pawn value + penalty for helping opponents
      const utilityPlace = pointsFromPlace + ownPawnsCount + Math.min(0, netScore) * 0.5;
      
      // Round adaptation: early rounds pass value is high, late rounds pass value is low
      let passWeight = 1.0;
      if (currentRound <= 3) {
        passWeight = 1.3;
      } else if (currentRound >= 9) {
        passWeight = 0.7;
      }
      
      const utilityPass = pointsFromPass * passWeight;

      if (utilityPass > utilityPlace) {
        // If we don't have sets with our own pawns in hand, check the exception:
        // "Jeżeli za wystawienie zestawu pozostałe nacje łącznie dostaną 0 lub mniej punktów, nadal można go wystawić."
        if (!hasOwnPawnsInHand) {
          const opponentsPoints = Object.entries(best.allScores || {}).reduce((sum, [race, pts]) => {
            if (race !== generalOf) {
              sum += pts;
            }
            return sum;
          }, 0);

          if (opponentsPoints <= 0) {
            return best; // Override pass, allow placement
          }
        }

        // AI chooses to pass and sell sets to Jakub instead of placing this set
        return null;
      }
    }
    return best;
  }
}
