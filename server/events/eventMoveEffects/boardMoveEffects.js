import { RACE_MAP_PL } from '../../eventConstants.js';

export class BoardMoveEffects {
  /**
   * Moves all pawns from border sectors closer to the center.
   * Corners are shifted diagonally closer, borders orthogonally closer.
   * @param {Object} gameData - The full game data.
   * @returns {string} Log of changes.
   */
  static applyChargeEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const movesToMake = [];
    const borderCoordinatesLog = [];
    let totalMoved = 0;

    gameData.regions.forEach(region => {
      const isBorder = region.x === 0 || region.x === 5 || region.y === 0 || region.y === 5;
      if (!isBorder) return;

      let hasPawns = false;
      Object.entries(region.pawns).forEach(([raceId, instances]) => {
        if (raceId === 'jakub') return; // Don't move Jakub
        if (instances.length === 0) return;

        hasPawns = true;
        let newX = region.x;
        let newY = region.y;
        if (region.x === 0) newX = 1;
        else if (region.x === 5) newX = 4;

        if (region.y === 0) newY = 1;
        else if (region.y === 5) newY = 4;

        const destRegion = gameData.regions.find(r => r.x === newX && r.y === newY);
        if (destRegion) {
          movesToMake.push({
            fromRegion: region,
            toRegion: destRegion,
            raceId: raceId,
            instances: [...instances]
          });
          totalMoved += instances.length;
        }
      });

      if (hasPawns) {
        borderCoordinatesLog.push(`(${region.x},${region.y})`);
      }
    });

    movesToMake.forEach(move => {
      const { fromRegion, toRegion, raceId, instances } = move;

      // Remove from source
      delete fromRegion.pawns[raceId];

      // Add to destination
      if (!toRegion.pawns[raceId]) {
        toRegion.pawns[raceId] = [];
      }
      toRegion.pawns[raceId].push(...instances);
    });

    if (totalMoved === 0) {
      return "Szarża: Brak pionków na sektorach granicznych.";
    }

    return `Szarża: Przeniesiono ${totalMoved} pionków z sektorów granicznych ${borderCoordinatesLog.join(', ')} bliżej środka.`;
  }

  /**
   * Moves all pawns from border corners 2 steps closer to the center.
   */
  static applyCornersToCenterEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const corners = [
      { from: { x: 0, y: 0 }, to: { x: 2, y: 2 } },
      { from: { x: 0, y: 5 }, to: { x: 2, y: 3 } },
      { from: { x: 5, y: 0 }, to: { x: 3, y: 2 } },
      { from: { x: 5, y: 5 }, to: { x: 3, y: 3 } }
    ];

    const movesToMake = [];
    const logs = [];
    let totalMoved = 0;

    corners.forEach(({ from, to }) => {
      const regionFrom = gameData.regions.find(r => r.x === from.x && r.y === from.y);
      const regionTo = gameData.regions.find(r => r.x === to.x && r.y === to.y);
      if (!regionFrom || !regionTo) return;

      Object.entries(regionFrom.pawns).forEach(([raceId, instances]) => {
        if (raceId === 'jakub') return; // Don't move Jakub
        const count = instances.length;
        if (count === 0) return;

        movesToMake.push({
          fromRegion: regionFrom,
          toRegion: regionTo,
          raceId,
          instances: [...instances]
        });
        const racePl = RACE_MAP_PL[raceId] || raceId;
        logs.push(`${count} x ${racePl} z (${from.x},${from.y}) -> (${to.x},${to.y})`);
        totalMoved += count;
      });
    });

    movesToMake.forEach(move => {
      const { fromRegion, toRegion, raceId, instances } = move;
      delete fromRegion.pawns[raceId];
      if (!toRegion.pawns[raceId]) {
        toRegion.pawns[raceId] = [];
      }
      toRegion.pawns[raceId].push(...instances);
    });

    if (totalMoved === 0) {
      return "Taktyczne Przeniesienie: Brak pionków w narożnikach planszy.";
    }

    return `Taktyczne Przeniesienie: Przeniesiono pionki z narożników bliżej środka: ${logs.join(', ')}.`;
  }

  /**
   * Moves all pawns from center 4 fields out to the respective corners.
   */
  static applyCenterToCornersEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const paths = [
      { from: { x: 2, y: 2 }, to: { x: 0, y: 0 } },
      { from: { x: 2, y: 3 }, to: { x: 0, y: 5 } },
      { from: { x: 3, y: 2 }, to: { x: 5, y: 0 } },
      { from: { x: 3, y: 3 }, to: { x: 5, y: 5 } }
    ];

    const movesToMake = [];
    const logs = [];
    let totalMoved = 0;

    paths.forEach(({ from, to }) => {
      const regionFrom = gameData.regions.find(r => r.x === from.x && r.y === from.y);
      const regionTo = gameData.regions.find(r => r.x === to.x && r.y === to.y);
      if (!regionFrom || !regionTo) return;

      Object.entries(regionFrom.pawns).forEach(([raceId, instances]) => {
        if (raceId === 'jakub') return; // Don't move Jakub
        const count = instances.length;
        if (count === 0) return;

        movesToMake.push({
          fromRegion: regionFrom,
          toRegion: regionTo,
          raceId,
          instances: [...instances]
        });
        const racePl = RACE_MAP_PL[raceId] || raceId;
        logs.push(`${count} x ${racePl} z (${from.x},${from.y}) -> (${to.x},${to.y})`);
        totalMoved += count;
      });
    });

    movesToMake.forEach(move => {
      const { fromRegion, toRegion, raceId, instances } = move;
      delete fromRegion.pawns[raceId];
      if (!toRegion.pawns[raceId]) {
        toRegion.pawns[raceId] = [];
      }
      toRegion.pawns[raceId].push(...instances);
    });

    if (totalMoved === 0) {
      return "Niezapowiedziana Panika: Brak pionków w centrum planszy.";
    }

    return `Niezapowiedziana Panika: Rozproszono pionki z centrum do narożników: ${logs.join(', ')}.`;
  }
}
