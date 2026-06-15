import { RACE_MAP_PL } from '../../eventConstants.js';

export class JakubMoveEffects {
  /**
   * Applies the "Mental Force Field" event.
   * Pawns at distance 1 from Jakub are pushed further away.
   * Pawns at distance 0 (same sector) are in the epicenter and do not move.
   * Pawns pushed outside the board are killed (-1 point per pawn to their general).
   * @param {Object} gameData - The full game data.
   * @returns {string} Detailed log of changes.
   */
  static applyMentalForceFieldEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const jakubRegion = gameData.regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    if (!jakubRegion) {
      return "Pole Siłowe: Jakub nie jest na planszy.";
    }

    const jx = jakubRegion.x;
    const jy = jakubRegion.y;

    const movesToMake = [];
    const killsToMake = [];
    const movedLogs = [];
    const killedLogs = [];
    const penaltyMap = {};
    let totalAffected = 0;

    gameData.regions.forEach(region => {
      const dist = Math.max(Math.abs(region.x - jx), Math.abs(region.y - jy));
      if (dist !== 1) return;

      Object.entries(region.pawns).forEach(([raceId, instances]) => {
        if (raceId === 'jakub') return;
        const count = instances.length;
        if (count === 0) return;

        const dx = region.x - jx;
        const dy = region.y - jy;
        const destX = region.x + dx;
        const destY = region.y + dy;

        const isInside = destX >= 0 && destX <= 5 && destY >= 0 && destY <= 5;
        if (isInside) {
          const destRegion = gameData.regions.find(r => r.x === destX && r.y === destY);
          if (destRegion) {
            movesToMake.push({
              fromRegion: region,
              toRegion: destRegion,
              raceId: raceId,
              instances: [...instances]
            });
            const racePl = RACE_MAP_PL[raceId] || raceId;
            movedLogs.push(`${count} x ${racePl} na (${region.x},${region.y}) -> (${destX},${destY})`);
          } else {
            killsToMake.push({
              fromRegion: region,
              raceId: raceId,
              instances: [...instances]
            });
            const racePl = RACE_MAP_PL[raceId] || raceId;
            killedLogs.push(`${count} x ${racePl} na (${region.x},${region.y}) (zabity)`);
          }
        } else {
          killsToMake.push({
            fromRegion: region,
            raceId: raceId,
            instances: [...instances]
          });
          const racePl = RACE_MAP_PL[raceId] || raceId;
          killedLogs.push(`${count} x ${racePl} na (${region.x},${region.y}) (zabity)`);
        }
        totalAffected += count;
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

    killsToMake.forEach(kill => {
      const { fromRegion, raceId, instances } = kill;
      delete fromRegion.pawns[raceId];

      const count = instances.length;
      const generalPlayer = gameData.players.find(p => p.generalOf === raceId);
      if (generalPlayer) {
        generalPlayer.points = Math.max(0, generalPlayer.points - count);
        penaltyMap[generalPlayer.name] = (penaltyMap[generalPlayer.name] || 0) + count;
      }
    });

    if (totalAffected === 0) {
      return "Pole Siłowe: Brak pionków w odległości 1 od Jakuba.";
    }

    const logs = [];
    if (movedLogs.length > 0) {
      logs.push(`Przeniesiono: ${movedLogs.join(', ')}`);
    }
    if (killedLogs.length > 0) {
      logs.push(`Zabito: ${killedLogs.join(', ')}`);
    }
    if (Object.keys(penaltyMap).length > 0) {
      const penaltyLogs = Object.entries(penaltyMap).map(([name, lost]) => `${name}: -${lost} pkt`);
      logs.push(`Kary: ${penaltyLogs.join(', ')}`);
    }

    return `Pole Siłowe: ${logs.join('. ')}`;
  }

  /**
   * Applies the "Jakub's Gravity" event.
   * Every pawn that is at a distance of 3 or more from Jakub is pulled 1 sector closer.
   * @param {Object} gameData - The full game data.
   * @returns {string} Detailed log of changes.
   */
  static applyJakubsGravityEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const jakubRegion = gameData.regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    if (!jakubRegion) {
      return "Grawitacja Jakuba: Jakub nie jest na planszy.";
    }

    const jx = jakubRegion.x;
    const jy = jakubRegion.y;

    const movesToMake = [];
    const movedLogs = [];
    let totalMoved = 0;

    gameData.regions.forEach(region => {
      const dist = Math.max(Math.abs(region.x - jx), Math.abs(region.y - jy));
      if (dist < 3) return;

      Object.entries(region.pawns).forEach(([raceId, instances]) => {
        if (raceId === 'jakub') return; // Don't move Jakub
        const count = instances.length;
        if (count === 0) return;

        const dx = jx - region.x;
        const dy = jy - region.y;
        const stepX = Math.sign(dx);
        const stepY = Math.sign(dy);

        const destX = region.x + stepX;
        const destY = region.y + stepY;

        const destRegion = gameData.regions.find(r => r.x === destX && r.y === destY);
        if (destRegion) {
          movesToMake.push({
            fromRegion: region,
            toRegion: destRegion,
            raceId: raceId,
            instances: [...instances]
          });
          const racePl = RACE_MAP_PL[raceId] || raceId;
          movedLogs.push(`${count} x ${racePl} na (${region.x},${region.y}) -> (${destX},${destY})`);
          totalMoved += count;
        }
      });
    });

    // Apply all gathered moves
    movesToMake.forEach(move => {
      const { fromRegion, toRegion, raceId, instances } = move;
      delete fromRegion.pawns[raceId];
      if (!toRegion.pawns[raceId]) {
        toRegion.pawns[raceId] = [];
      }
      toRegion.pawns[raceId].push(...instances);
    });

    if (totalMoved === 0) {
      return "Grawitacja Jakuba: Brak pionków w odległości 3 lub więcej od Jakuba.";
    }

    return `Grawitacja Jakuba: Przyciągnięto ${totalMoved} pionków bliżej Jakuba: ${movedLogs.join(', ')}`;
  }

  /**
   * Moves Jakub to the region with the most pawns (ties broken by band hierarchy).
   * If there is an unresolved tie or no pawns on the board, he doesn't move and gains +2 fury to all bands.
   */
  static applyJakubsTornadoEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const jakubRegion = gameData.regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    if (!jakubRegion) {
      return "Trąba Powietrzna: Jakub nie jest na planszy.";
    }
    const jakubPawn = jakubRegion.pawns.jakub[0];

    // Count pawns in each region (excluding Jakub)
    const candidates = gameData.regions.map(region => {
      const vCount = region.pawns.vampire?.length || 0;
      const wCount = region.pawns.werewolf?.length || 0;
      const gCount = region.pawns.ghost?.length || 0;
      const bCount = region.pawns.bardak?.length || 0;
      const total = vCount + wCount + gCount + bCount;
      return { region, total, vampire: vCount, werewolf: wCount, ghost: gCount, bardak: bCount };
    }).filter(c => c.total > 0);

    const compareCandidates = (a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.vampire !== a.vampire) return b.vampire - a.vampire;
      if (b.werewolf !== a.werewolf) return b.werewolf - a.werewolf;
      if (b.ghost !== a.ghost) return b.ghost - a.ghost;
      if (b.bardak !== a.bardak) return b.bardak - a.bardak;
      return 0;
    };

    if (candidates.length === 0) {
      return this.applyJakubTornadoFuryIncrease(jakubPawn, jakubRegion, "brak pionków na planszy");
    }

    candidates.sort(compareCandidates);

    const best = candidates[0];
    let hasTie = false;
    if (candidates.length > 1) {
      if (compareCandidates(best, candidates[1]) === 0) {
        hasTie = true;
      }
    }

    if (hasTie) {
      return this.applyJakubTornadoFuryIncrease(jakubPawn, jakubRegion, "remis w liczbie i składzie pionków");
    }

    if (best.region.id !== jakubRegion.id) {
      // Move Jakub
      jakubRegion.pawns.jakub = [];
      delete jakubRegion.pawns.jakub;

      if (!best.region.pawns.jakub) {
        best.region.pawns.jakub = [];
      }
      best.region.pawns.jakub.push(jakubPawn);

      return `Trąba Powietrzna: Jakub przenosi się z (${jakubRegion.x},${jakubRegion.y}) do sektora (${best.region.x},${best.region.y}), ponieważ zawiera on najwięcej pionków (Suma: ${best.total}, Skład: Wampiry: ${best.vampire}, Wilkołaki: ${best.werewolf}, Duchy: ${best.ghost}, Bardaki: ${best.bardak}).`;
    } else {
      return `Trąba Powietrzna: Jakub pozostaje w swoim sektorze (${jakubRegion.x},${jakubRegion.y}), ponieważ zawiera on najwięcej pionków (Suma: ${best.total}).`;
    }
  }

  static applyJakubTornadoFuryIncrease(jakubPawn, jakubRegion, reason) {
    const oldAngers = {
      vampire: jakubPawn.anger.vampire || 0,
      werewolf: jakubPawn.anger.werewolf || 0,
      ghost: jakubPawn.anger.ghost || 0,
      bardak: jakubPawn.anger.bardak || 0
    };

    jakubPawn.anger.vampire = oldAngers.vampire + 2;
    jakubPawn.anger.werewolf = oldAngers.werewolf + 2;
    jakubPawn.anger.ghost = oldAngers.ghost + 2;
    jakubPawn.anger.bardak = oldAngers.bardak + 2;

    // Recalculate Range
    let extraRange = 0;
    Object.values(jakubPawn.anger).forEach(val => {
      if (val >= 10) {
        extraRange += 1;
      }
    });
    const newRange = Math.min(5, 1 + extraRange);
    jakubPawn.range = newRange;

    const furyLogs = [
      `Wampiry: ${oldAngers.vampire} -> ${jakubPawn.anger.vampire}`,
      `Wilkołaki: ${oldAngers.werewolf} -> ${jakubPawn.anger.werewolf}`,
      `Duchy: ${oldAngers.ghost} -> ${jakubPawn.anger.ghost}`,
      `Bardaki: ${oldAngers.bardak} -> ${jakubPawn.anger.bardak}`
    ];

    return `Trąba Powietrzna: Jakub nie rusza się z (${jakubRegion.x},${jakubRegion.y}) (${reason}) i wścieka się. Zmiany furii: ${furyLogs.join(', ')} (Zasięg zaktualizowany do ${newRange}).`;
  }
}
