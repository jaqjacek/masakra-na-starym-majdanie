import { RACE_MAP_PL } from '../eventConstants.js';
import { BoardMoveEffects } from './eventMoveEffects/boardMoveEffects.js';
import { JakubMoveEffects } from './eventMoveEffects/jakubMoveEffects.js';
import { RaceMoveEffects } from './eventMoveEffects/raceMoveEffects.js';

export class EventMoveEffects {
  /**
   * Moves pawns from one sector to another.
   * @param {Object} gameData - The full game data.
   * @param {Object} value - { from: {x, y}, to: {x, y} }
   * @returns {string} Log of changes.
   */
  static applyMoveEffect(gameData, value) {
    if (!gameData || !value) return "";

    if (value === 'charge') {
      return BoardMoveEffects.applyChargeEffect(gameData);
    }
    if (value === 'mental_force_field') {
      return JakubMoveEffects.applyMentalForceFieldEffect(gameData);
    }
    if (value === 'bardak_cowardice') {
      return RaceMoveEffects.applyBardakCowardiceEffect(gameData);
    }
    if (value === 'jakubs_gravity') {
      return JakubMoveEffects.applyJakubsGravityEffect(gameData);
    }
    if (value === 'crimson_convergence') {
      return RaceMoveEffects.applyCrimsonConvergenceEffect(gameData);
    }
    if (value === 'alphas_call') {
      return RaceMoveEffects.applyAlphasCallEffect(gameData);
    }
    if (value === 'lunar_alignment') {
      return RaceMoveEffects.applyLunarAlignmentEffect(gameData);
    }
    if (value === 'corners_to_center') {
      return BoardMoveEffects.applyCornersToCenterEffect(gameData);
    }
    if (value === 'center_to_corners') {
      return BoardMoveEffects.applyCenterToCornersEffect(gameData);
    }
    if (value === 'jakubs_tornado') {
      return JakubMoveEffects.applyJakubsTornadoEffect(gameData);
    }

    if (!value.from || !value.to) return "";

    const { from, to } = value;
    const regionFrom = gameData.regions.find(r => r.x === from.x && r.y === from.y);
    const regionTo = gameData.regions.find(r => r.x === to.x && r.y === to.y);

    if (!regionFrom || !regionTo) {
      return `Ruch: Nieprawidłowe sektory (Nie znaleziono źródła (${from.x},${from.y}) lub celu (${to.x},${to.y})).`;
    }

    const movedLogs = [];
    let totalMoved = 0;

    Object.entries(regionFrom.pawns).forEach(([raceId, instances]) => {
      if (raceId === 'jakub') return; // Don't move Jakub

      const count = instances.length;
      if (count === 0) return;

      if (!regionTo.pawns[raceId]) {
        regionTo.pawns[raceId] = [];
      }
      regionTo.pawns[raceId].push(...instances);
      delete regionFrom.pawns[raceId];

      const racePl = RACE_MAP_PL[raceId] || raceId;
      movedLogs.push(`${count} x ${racePl}`);
      totalMoved += count;
    });

    if (totalMoved === 0) {
      return `Ruch: Nie znaleziono pionków na (${from.x},${from.y}) do przeniesienia na (${to.x},${to.y}).`;
    }

    return `Ruch: Przeniesiono ${movedLogs.join(', ')} z (${from.x},${from.y}) na (${to.x},${to.y}).`;
  }
}
