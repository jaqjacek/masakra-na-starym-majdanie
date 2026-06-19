import { RACE_MAP_PL } from '../../eventConstants.js';
import { trackPointsChange } from '../../../shared/statsManager.js';

export class RaceMoveEffects {
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
            const prevPoints = bardakPlayer.points;
            bardakPlayer.points = Math.max(0, bardakPlayer.points - count);
            const actualLoss = prevPoints - bardakPlayer.points;
            if (actualLoss > 0) {
              trackPointsChange(bardakPlayer, 'bardak', -actualLoss, 'event');
            }
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
}
