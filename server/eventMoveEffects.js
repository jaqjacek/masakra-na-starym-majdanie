import { RACE_MAP, RACE_MAP_PL } from './eventConstants.js';

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
      return this.applyChargeEffect(gameData);
    }
    if (value === 'mental_force_field') {
      return this.applyMentalForceFieldEffect(gameData);
    }
    if (value === 'bardak_cowardice') {
      return this.applyBardakCowardiceEffect(gameData);
    }
    if (value === 'jakubs_gravity') {
      return this.applyJakubsGravityEffect(gameData);
    }
    if (value === 'crimson_convergence') {
      return this.applyCrimsonConvergenceEffect(gameData);
    }
    if (value === 'alphas_call') {
      return this.applyAlphasCallEffect(gameData);
    }
    if (value === 'lunar_alignment') {
      return this.applyLunarAlignmentEffect(gameData);
    }
    if (value === 'corners_to_center') {
      return this.applyCornersToCenterEffect(gameData);
    }
    if (value === 'center_to_corners') {
      return this.applyCenterToCornersEffect(gameData);
    }
    if (value === 'jakubs_tornado') {
      return this.applyJakubsTornadoEffect(gameData);
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
   * Applies the "Bardak Cowardice" event.
   * Scans sectors row-by-row. If a sector contains ONLY Bardak pawns:
   * 1. Finds neighbors with the most non-Bardak pawns (V, W, G).
   * 2. Resolves ties using priority V -> W -> G.
   * 3. Moves Bardaks to the target if a single winning neighbor is found.
   * 4. Otherwise (no neighbors with units, or unresolved tie), Bardaks run away (-1 pt to general per pawn).
   * @param {Object} gameData - The full game data.
   * @returns {string} Detailed log of changes.
   */
  static applyBardakCowardiceEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const movedLogs = [];
    const runawayLogs = [];
    let totalMoved = 0;
    let totalRunaway = 0;
    let totalPenalties = 0;

    // Row-major order iteration (id 0 to 35 matches row-major creation order)
    const sortedRegions = [...gameData.regions].sort((a, b) => a.id - b.id);

    sortedRegions.forEach(region => {
      const hasBardak = region.pawns.bardak && region.pawns.bardak.length > 0;
      const hasVampire = region.pawns.vampire && region.pawns.vampire.length > 0;
      const hasWerewolf = region.pawns.werewolf && region.pawns.werewolf.length > 0;
      const hasGhost = region.pawns.ghost && region.pawns.ghost.length > 0;
      const hasJakub = region.pawns.jakub && region.pawns.jakub.length > 0;

      if (hasBardak && !hasVampire && !hasWerewolf && !hasGhost && !hasJakub) {
        const bardaksToMove = [...region.pawns.bardak];
        const count = bardaksToMove.length;

        // Find candidate neighbors with V, W, G pawns
        const candidates = [];
        region.neighbors.forEach(nIdx => {
          const neighbor = gameData.regions.find(r => r.id === nIdx);
          if (!neighbor) return;

          const vCount = neighbor.pawns.vampire?.length || 0;
          const wCount = neighbor.pawns.werewolf?.length || 0;
          const gCount = neighbor.pawns.ghost?.length || 0;
          const totalOthers = vCount + wCount + gCount;

          if (totalOthers > 0) {
            candidates.push({
              region: neighbor,
              totalOthers,
              vCount,
              wCount,
              gCount
            });
          }
        });

        let winner = null;
        if (candidates.length > 0) {
          // Find max totalOthers
          const maxOthers = Math.max(...candidates.map(c => c.totalOthers));
          let tied = candidates.filter(c => c.totalOthers === maxOthers);

          // Tiebreaker: Vampires (V)
          if (tied.length > 1) {
            const maxV = Math.max(...tied.map(c => c.vCount));
            tied = tied.filter(c => c.vCount === maxV);
          }
          // Tiebreaker: Werewolves (W)
          if (tied.length > 1) {
            const maxW = Math.max(...tied.map(c => c.wCount));
            tied = tied.filter(c => c.wCount === maxW);
          }
          // Tiebreaker: Ghosts (G)
          if (tied.length > 1) {
            const maxG = Math.max(...tied.map(c => c.gCount));
            tied = tied.filter(c => c.gCount === maxG);
          }

          if (tied.length === 1) {
            winner = tied[0].region;
          }
        }

        // Apply move or runaway
        delete region.pawns.bardak;

        if (winner) {
          if (!winner.pawns.bardak) {
            winner.pawns.bardak = [];
          }
          winner.pawns.bardak.push(...bardaksToMove);
          movedLogs.push(`${count} x Bardaków na (${region.x},${region.y}) -> (${winner.x},${winner.y})`);
          totalMoved += count;
        } else {
          // Runaway from battlefield
          runawayLogs.push(`${count} x Bardaków na (${region.x},${region.y})`);
          totalRunaway += count;

          // Deduct points from Bardak general
          const bardakPlayer = gameData.players.find(p => p.generalOf === 'bardak');
          if (bardakPlayer) {
            bardakPlayer.points = Math.max(0, bardakPlayer.points - count);
            totalPenalties += count;
          }
        }
      }
    });

    if (totalMoved === 0 && totalRunaway === 0) {
      return "Tchórzostwo Bardaków: Nie znaleziono sektorów z samotnymi Bardakami.";
    }

    const logs = [];
    if (movedLogs.length > 0) {
      logs.push(`Uciekli: ${movedLogs.join(', ')}`);
    }
    if (runawayLogs.length > 0) {
      logs.push(`Zdezerterowali: ${runawayLogs.join(', ')}`);
    }
    if (totalPenalties > 0) {
      logs.push(`Kary: Generał Bardaków stracił ${totalPenalties} pkt`);
    }

    return `Tchórzostwo Bardaków: ${logs.join('. ')}`;
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
   * Applies the "Crimson Convergence" event.
   * Relocates all Vampire pawns on the board to the sector with Jakub.
   * @param {Object} gameData - The full game data.
   * @returns {string} Detailed log of changes.
   */
  static applyCrimsonConvergenceEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const jakubRegion = gameData.regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    if (!jakubRegion) {
      return "Purpurowa Zbieżność: Jakub nie jest na planszy.";
    }

    const movesToMake = [];
    const sourceSectorsLog = [];
    let totalMoved = 0;

    gameData.regions.forEach(region => {
      if (region.id === jakubRegion.id) return; // Skip Jakub's region

      const hasVampires = region.pawns.vampire && region.pawns.vampire.length > 0;
      if (hasVampires) {
        const vampires = [...region.pawns.vampire];
        movesToMake.push({
          fromRegion: region,
          instances: vampires
        });
        totalMoved += vampires.length;
        sourceSectorsLog.push(`(${region.x},${region.y})[${vampires.length}]`);
      }
    });

    movesToMake.forEach(move => {
      const { fromRegion, instances } = move;
      delete fromRegion.pawns.vampire;

      if (!jakubRegion.pawns.vampire) {
        jakubRegion.pawns.vampire = [];
      }
      jakubRegion.pawns.vampire.push(...instances);
    });

    if (totalMoved === 0) {
      return "Purpurowa Zbieżność: Brak Wampirów na planszy poza sektorem Jakuba.";
    }

    return `Purpurowa Zbieżność: Przeniesiono ${totalMoved} Wampirów z sektorów ${sourceSectorsLog.join(', ')} do sektora Jakuba na (${jakubRegion.x},${jakubRegion.y}).`;
  }

  /**
   * Applies the "Alpha's Call" event.
   * Finds the sector with the most Werewolves (closest to Jakub if tied).
   * Pulls all single (lonely) Werewolves 1 sector closer to that main pack.
   * @param {Object} gameData - The full game data.
   * @returns {string} Detailed log of changes.
   */
  static applyAlphasCallEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const jakubRegion = gameData.regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    const jx = jakubRegion ? jakubRegion.x : 2;
    const jy = jakubRegion ? jakubRegion.y : 2;

    let maxWerewolves = 0;
    let targetCandidates = [];

    gameData.regions.forEach(region => {
      const wCount = region.pawns.werewolf?.length || 0;
      if (wCount > maxWerewolves) {
        maxWerewolves = wCount;
        targetCandidates = [region];
      } else if (wCount === maxWerewolves && wCount > 0) {
        targetCandidates.push(region);
      }
    });

    if (maxWerewolves === 0) {
      return "Zew Alfy: Brak Wilkołaków na planszy.";
    }

    let targetRegion = targetCandidates[0];
    if (targetCandidates.length > 1) {
      let minDist = 999;
      targetCandidates.forEach(r => {
        const dist = Math.max(Math.abs(r.x - jx), Math.abs(r.y - jy));
        if (dist < minDist) {
          minDist = dist;
          targetRegion = r;
        }
      });
    }

    const tx = targetRegion.x;
    const ty = targetRegion.y;

    const movesToMake = [];
    const movedLogs = [];
    let totalMoved = 0;

    gameData.regions.forEach(region => {
      if (region.id === targetRegion.id) return;

      const wCount = region.pawns.werewolf?.length || 0;
      if (wCount === 1) {
        const dx = tx - region.x;
        const dy = ty - region.y;
        const stepX = Math.sign(dx);
        const stepY = Math.sign(dy);

        const destX = region.x + stepX;
        const destY = region.y + stepY;

        const destRegion = gameData.regions.find(r => r.x === destX && r.y === destY);
        if (destRegion) {
          movesToMake.push({
            fromRegion: region,
            toRegion: destRegion,
            werewolfInstance: region.pawns.werewolf[0]
          });
          movedLogs.push(`(${region.x},${region.y}) -> (${destX},${destY})`);
          totalMoved++;
        }
      }
    });

    movesToMake.forEach(move => {
      const { fromRegion, toRegion, werewolfInstance } = move;
      if (fromRegion.pawns.werewolf) {
        const wIdx = fromRegion.pawns.werewolf.indexOf(werewolfInstance);
        if (wIdx !== -1) {
          fromRegion.pawns.werewolf.splice(wIdx, 1);
          if (fromRegion.pawns.werewolf.length === 0) {
            delete fromRegion.pawns.werewolf;
          }
        }
      }

      if (!toRegion.pawns.werewolf) {
        toRegion.pawns.werewolf = [];
      }
      toRegion.pawns.werewolf.push(werewolfInstance);
    });

    if (totalMoved === 0) {
      return `Zew Alfy: Główna wataha znajduje się na (${tx},${ty}) [Wilkołaki: ${maxWerewolves}], ale nie znaleziono samotnych Wilkołaków do przyciągnięcia.`;
    }

    return `Zew Alfy: Główna wataha znajduje się na (${tx},${ty}) [Wilkołaki: ${maxWerewolves}]. Przyciągnięto ${totalMoved} samotnych Wilkołaków bliżej: ${movedLogs.join(', ')}.`;
  }

  /**
   * Applies the "Lunar Alignment" event.
   * Every lonely Werewolf (exactly 1 in a sector) moves 1 sector closer to the nearest Werewolf pack (2 or more in a sector).
   * @param {Object} gameData - The full game data.
   * @returns {string} Detailed log of changes.
   */
  static applyLunarAlignmentEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const jakubRegion = gameData.regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    const jx = jakubRegion ? jakubRegion.x : 2;
    const jy = jakubRegion ? jakubRegion.y : 2;

    const lonelyRegions = [];
    const packRegions = [];

    gameData.regions.forEach(region => {
      const wCount = region.pawns.werewolf?.length || 0;
      if (wCount === 1) {
        lonelyRegions.push(region);
      } else if (wCount >= 2) {
        packRegions.push(region);
      }
    });

    if (lonelyRegions.length === 0) {
      return "Koniunkcja Księżyców: Brak samotnych Wilkołaków na planszy.";
    }

    if (packRegions.length === 0) {
      return "Koniunkcja Księżyców: Brak watah Wilkołaków (2+ Wilkołaków w sektorze) do przyciągnięcia samotnych jednostek.";
    }

    const movesToMake = [];
    const movedLogs = [];
    let totalMoved = 0;

    lonelyRegions.forEach(region => {
      let minDistance = 999;
      let nearestPacks = [];

      packRegions.forEach(pack => {
        const dist = Math.max(Math.abs(pack.x - region.x), Math.abs(pack.y - region.y));
        if (dist < minDistance) {
          minDistance = dist;
          nearestPacks = [pack];
        } else if (dist === minDistance) {
          nearestPacks.push(pack);
        }
      });

      let targetPack = nearestPacks[0];
      if (nearestPacks.length > 1) {
        let minJakubDist = 999;
        nearestPacks.forEach(pack => {
          const jDist = Math.max(Math.abs(pack.x - jx), Math.abs(pack.y - jy));
          if (jDist < minJakubDist) {
            minJakubDist = jDist;
            targetPack = pack;
          }
        });
      }

      const dx = targetPack.x - region.x;
      const dy = targetPack.y - region.y;
      const stepX = Math.sign(dx);
      const stepY = Math.sign(dy);

      const destX = region.x + stepX;
      const destY = region.y + stepY;

      const destRegion = gameData.regions.find(r => r.x === destX && r.y === destY);
      if (destRegion) {
        movesToMake.push({
          fromRegion: region,
          toRegion: destRegion,
          werewolfInstance: region.pawns.werewolf[0]
        });
        movedLogs.push(`(${region.x},${region.y}) -> (${destX},${destY}) w kierunku watahy na (${targetPack.x},${targetPack.y})`);
        totalMoved++;
      }
    });

    movesToMake.forEach(move => {
      const { fromRegion, toRegion, werewolfInstance } = move;

      if (fromRegion.pawns.werewolf) {
        const wIdx = fromRegion.pawns.werewolf.indexOf(werewolfInstance);
        if (wIdx !== -1) {
          fromRegion.pawns.werewolf.splice(wIdx, 1);
          if (fromRegion.pawns.werewolf.length === 0) {
            delete fromRegion.pawns.werewolf;
          }
        }
      }

      if (!toRegion.pawns.werewolf) {
        toRegion.pawns.werewolf = [];
      }
      toRegion.pawns.werewolf.push(werewolfInstance);
    });

    if (totalMoved === 0) {
      return "Koniunkcja Księżyców: Nie udało się przyciągnąć żadnych samotnych Wilkołaków bliżej watah.";
    }

    return `Koniunkcja Księżyców: Skonsolidowano ${totalMoved} samotnych Wilkołaków bliżej watah: ${movedLogs.join(', ')}.`;
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
