import { Scoring } from './scoring/scoring.js';
import {
  RACES,
  DEFAULT_JAKUB_DISTANCE,
  regionXY,
  MAX_SETS_KEPT_ON_PASS,
  TOTAL_GAME_ROUNDS,
  VAMPIRE_FINAL_SCORING_MULTIPLIER,
  GHOST_FINAL_SCORING_BONUS,
  GHOST_FINAL_SCORING_MAX_OTHER_BONUS,
  BARDAK_FINAL_MAJORITY_BONUS,
  KABLOWANIE_POINTS,
  AI_KABLOWANIE_OWN_PAWN_COST,
  AI_KABLOWANIE_RANGE_BUMP_COST,
  AI_KABLOWANIE_OPPONENT_PAWN_BONUS,
  AI_KABLOWANIE_OPPONENT_BONUS_CAP,
  AI_THREAT_IN_RANGE_MULTIPLIER,
  AI_THREAT_NEAR_RANGE_MULTIPLIER,
  computeJakubRange
} from './constants.js';
import { VampireScoring } from './scoring/vampireScoring.js';
import { WerewolfScoring } from './scoring/werewolfScoring.js';
import { GhostScoring } from './scoring/ghostScoring.js';
import { BardakScoring } from './scoring/bardakScoring.js';

/**
 * Marginal final-scoring value of placing this set on an empty region.
 * Vampire: one new region, not a per-tile constant. Ghost/bardak compare
 * own count to the largest other race, matching calculateFinal.
 */
function endGameValue(generalOf, set) {
  const own = set.content?.[generalOf] || 0;
  if (own <= 0 || !generalOf) return 0;

  const others = RACES.filter((race) => race !== generalOf).map((race) => set.content[race] || 0);
  const maxOther = others.reduce((max, count) => Math.max(max, count), 0);
  const othersTotal = others.reduce((sum, count) => sum + count, 0);

  if (generalOf === 'vampire') return VAMPIRE_FINAL_SCORING_MULTIPLIER;
  if (generalOf === 'ghost') {
    if (othersTotal === 0) return GHOST_FINAL_SCORING_BONUS;
    if (own > maxOther) return GHOST_FINAL_SCORING_MAX_OTHER_BONUS;
    return 0;
  }
  if (generalOf === 'bardak') {
    return own > maxOther ? BARDAK_FINAL_MAJORITY_BONUS : 0;
  }
  if (generalOf === 'werewolf') return own;
  return 0;
}

/**
 * Value of voluntarily giving this set to Jakub (+1) minus the fury cost.
 * Own-race pawns are expensive. A range increase is expensive. Opponent pawns
 * are a small bonus only when the set has none of our general.
 */
export function kablowanieValue(set, jakub, generalOf) {
  const content = set?.content || {};
  const own = generalOf ? (content[generalOf] || 0) : 0;
  let value = KABLOWANIE_POINTS - own * AI_KABLOWANIE_OWN_PAWN_COST;
  if (!jakub) return value;

  const nextAnger = { ...(jakub.anger || {}) };
  Object.entries(content).forEach(([race, count]) => {
    if (nextAnger[race] !== undefined) nextAnger[race] += count;
  });
  if (computeJakubRange(nextAnger) > computeJakubRange(jakub.anger)) {
    value -= AI_KABLOWANIE_RANGE_BUMP_COST;
  }
  if (own === 0) {
    const opp = RACES.reduce((sum, race) => sum + (race === generalOf ? 0 : (content[race] || 0)), 0);
    value += Math.min(AI_KABLOWANIE_OPPONENT_BONUS_CAP, opp * AI_KABLOWANIE_OPPONENT_PAWN_BONUS);
  }
  return value;
}

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
   * Best voluntary snitch in hand, or null when none beats passing (score <= 0).
   */
  static bestKablowanie(hand, jakub, generalOf) {
    let best = null;
    let bestScore = 0;
    (hand || []).forEach((set) => {
      const score = kablowanieValue(set, jakub, generalOf);
      if (score > bestScore) {
        bestScore = score;
        best = set;
      }
    });
    return best ? { set: best, score: bestScore } : null;
  }

  /**
   * One player action: place, kablowanie, or pass. Same units as strategicScore.
   * Place wins ties with kablowanie. Kablowanie must beat 0 to beat pass.
   */
  static choosePlayerAction(best, hand, jakub, generalOf) {
    const placeScore = best && Number.isFinite(best.strategicScore) ? best.strategicScore : -Infinity;
    const snitch = this.bestKablowanie(hand, jakub, generalOf);
    const snitchScore = snitch ? snitch.score : -Infinity;
    if (best && placeScore >= snitchScore && placeScore >= 0) {
      return { type: 'place', placement: best, score: placeScore };
    }
    if (snitch && snitchScore > placeScore) {
      return { type: 'kablowanie', set: snitch.set, score: snitchScore };
    }
    return { type: 'pass', score: 0 };
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
    const roundWeight = Math.min(1, Math.max(0, (Number(currentRound) || 1) / TOTAL_GAME_ROUNDS));

    let best = null;
    let bestStrategicScore = -Infinity;

    placeableSets.forEach(set => {
      const endGameBonus = endGameValue(generalOf, set) * roundWeight;
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

        // Jakub threat. Endgame value is per set (see endGameValue), scaled by round.
        let threatPenalty = 0;
        const ourPawnCountInSet = set.content[generalOf] || 0;
        if (ourPawnCountInSet > 0 && jakub && (jakub.anger[generalOf] || 0) > 0) {
          if (dist <= jakubRange) {
            threatPenalty += (jakub.anger[generalOf] || 0) * ourPawnCountInSet * AI_THREAT_IN_RANGE_MULTIPLIER;
          } else if (dist <= jakubRange + 1) {
            threatPenalty += (jakub.anger[generalOf] || 0) * ourPawnCountInSet * AI_THREAT_NEAR_RANGE_MULTIPLIER;
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

    // Same score ranks candidates and decides place vs pass. Pass is worth 0.
    if (!best || bestStrategicScore < 0) return null;

    best.allScores = Scoring.calculatePlacementPoints(regions, best.region, best.set.content);
    return best;
  }
}
