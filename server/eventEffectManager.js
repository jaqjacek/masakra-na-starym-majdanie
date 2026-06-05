/**
 * Manager responsible for applying event effects to the game state.
 */
export class EventEffectManager {
  static RACE_MAP = {
    'V': 'vampire',
    'W': 'werewolf',
    'G': 'ghost',
    'B': 'bardak'
  };

  static RACE_MAP_PL = {
    'vampire': 'Wampiry',
    'werewolf': 'Wilkołaki',
    'ghost': 'Duchy',
    'bardak': 'Bardaki'
  };

  /**
   * Applies the effect of an event to Jakub's anger and returns a log of changes.
   * @param {Object} jakubInterface - Interface from GameEventPhaseManager.
   * @param {string} type - 'anger-plus' or 'anger-minus'.
   * @param {Object} value - Mapping of initials to values (e.g., { "W": 2 }).
   * @returns {string} Detailed log of changes.
   */
  static applyAngerEffect(jakubInterface, type, value) {
    if (!jakubInterface || !value) return "";

    const logs = [];
    const currentAngers = jakubInterface.getAnger();

    Object.entries(value).forEach(([initial, amount]) => {
      const raceName = this.RACE_MAP[initial];
      if (!raceName) return;

      const oldAnger = currentAngers[raceName] || 0;
      let newAnger = oldAnger;

      if (type === 'anger-plus') {
        newAnger = oldAnger + amount;
        jakubInterface.setAnger(raceName, newAnger);
      } else if (type === 'anger-minus') {
        newAnger = Math.max(0, oldAnger - amount);
        jakubInterface.setAnger(raceName, newAnger);
      }

      if (oldAnger !== newAnger) {
        const racePl = this.RACE_MAP_PL[raceName] || raceName;
        logs.push(`${racePl}: ${oldAnger} -> ${newAnger}`);
      }
    });

    // Recalculate Range!
    const updatedAngers = jakubInterface.getAnger();
    let extraRange = 0;
    Object.values(updatedAngers).forEach(val => {
      if (val >= 10) {
        extraRange += 1;
      }
    });
    const newRange = Math.min(5, 1 + extraRange);
    jakubInterface.setRange(newRange);

    return logs.length > 0 ? `Zmiany furii: ${logs.join(', ')} (Zasięg zaktualizowany do ${newRange})` : "Brak zmian furii.";
  }

  /**
   * Applies the effect of an event to pawn limits and returns a log of changes.
   * @param {Object} setsInterface - Interface from GameEventPhaseManager.
   * @param {string} type - 'pawnsTotal-plus' or 'pawnsTotal-minus'.
   * @param {Object} value - Mapping of initials to values.
   * @returns {string} Detailed log of changes.
   */
  static applyPawnLimitEffect(setsInterface, type, value) {
    if (!setsInterface || !value) return "";

    const logs = [];
    const currentLimits = setsInterface.getLimits();

    Object.entries(value).forEach(([initial, amount]) => {
      const raceName = this.RACE_MAP[initial];
      if (!raceName) return;

      const oldLimit = currentLimits[raceName] || 0;
      let newLimit = oldLimit;

      if (type === 'pawnsTotal-plus') {
        newLimit = oldLimit + amount;
        setsInterface.setLimit(raceName, newLimit);
      } else if (type === 'pawnsTotal-minus') {
        newLimit = Math.max(0, oldLimit - amount);
        setsInterface.setLimit(raceName, newLimit);
      }

      if (oldLimit !== newLimit) {
        const racePl = this.RACE_MAP_PL[raceName] || raceName;
        logs.push(`${racePl}: ${oldLimit} -> ${newLimit}`);
      }
    });

    return logs.length > 0 ? `Zmiany limitu pionków: ${logs.join(', ')}` : "Brak zmian limitu pionków.";
  }

  /**
   * Wipes pawns from specific sectors and penalizes generals.
   * @param {Object} gameData - The full game data.
   * @param {Array} sectors - Array of {x, y} coordinates.
   * @returns {string} Log of changes.
   */
  static applyWipeSectorsEffect(gameData, sectors) {
    if (!gameData || !sectors) return "";
    
    const logs = [];
    const penaltyMap = {}; // { playerName: pointsLost }

    sectors.forEach(target => {
      const region = gameData.regions.find(r => r.x === target.x && r.y === target.y);
      if (!region) return;

      Object.entries(region.pawns).forEach(([raceId, instances]) => {
        if (raceId === 'jakub') return; // Don't wipe Jakub
        
        const count = instances.length;
        if (count === 0) return;

        // Find general for this race
        const generalPlayer = gameData.players.find(p => p.generalOf === raceId);
        if (generalPlayer) {
          generalPlayer.points = Math.max(0, generalPlayer.points - count);
          penaltyMap[generalPlayer.name] = (penaltyMap[generalPlayer.name] || 0) + count;
        }

        // Remove pawns
        delete region.pawns[raceId];
        const racePl = this.RACE_MAP_PL[raceId] || raceId;
        logs.push(`${count} x ${racePl} na (${target.x},${target.y})`);
      });
    });

    if (logs.length === 0) return "Czystka sektorów: nie usunięto żadnych pionków.";

    const penaltyLogs = Object.entries(penaltyMap).map(([name, lost]) => `${name}: -${lost} pkt`);
    return `Czystka sektorów: Usunięto ${logs.join(', ')}. Kary: ${penaltyLogs.join(', ')}`;
  }

  /**
   * Distributes extra sets to all players.
   * @param {Object} gameData - The full game data.
   * @param {number} count - Number of sets per player.
   * @returns {string} Log of changes.
   */
  static applySupportEffect(gameData, count) {
    if (!gameData || !gameData.players || !gameData.sets || !count) return "";

    let totalDistributed = 0;
    const sets = gameData.sets;
    
    // Helper to draw a set
    const drawSet = () => {
      if (!sets.drawPile || sets.drawPile.length === 0) {
        if (sets.discardPile && sets.discardPile.length > 0) {
          sets.drawPile = [...sets.discardPile];
          sets.discardPile = [];
        } else {
          return null;
        }
      }
      const randomIdx = Math.floor(Math.random() * sets.drawPile.length);
      return sets.drawPile.splice(randomIdx, 1)[0];
    };

    gameData.players.forEach(player => {
      for (let i = 0; i < count; i++) {
        const set = drawSet();
        if (set) {
          set.ownerId = player.id;
          if (!sets.heldSets) sets.heldSets = [];
          sets.heldSets.push(set);
          totalDistributed++;
        }
      }
    });

    return totalDistributed > 0 
      ? `Wsparcie: Rozdano po ${count} dodatkowym zestawie każdemu graczowi (Suma: ${totalDistributed}).`
      : "Wsparcie: Brak dostępnych zestawów do rozdania.";
  }

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

      const racePl = this.RACE_MAP_PL[raceId] || raceId;
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
            const racePl = this.RACE_MAP_PL[raceId] || raceId;
            movedLogs.push(`${count} x ${racePl} na (${region.x},${region.y}) -> (${destX},${destY})`);
          } else {
            killsToMake.push({
              fromRegion: region,
              raceId: raceId,
              instances: [...instances]
            });
            const racePl = this.RACE_MAP_PL[raceId] || raceId;
            killedLogs.push(`${count} x ${racePl} na (${region.x},${region.y}) (zabity)`);
          }
        } else {
          killsToMake.push({
            fromRegion: region,
            raceId: raceId,
            instances: [...instances]
          });
          const racePl = this.RACE_MAP_PL[raceId] || raceId;
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
          const racePl = this.RACE_MAP_PL[raceId] || raceId;
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
        const racePl = this.RACE_MAP_PL[raceId] || raceId;
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
        const racePl = this.RACE_MAP_PL[raceId] || raceId;
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

  /**
   * Applies the "transformation" event effect.
   * Transforms Bardak pawns into a target race.
   * Decreases Bardak total pools and increases target race pools.
   * @param {Object} gameData - The full game data.
   * @param {Object} value - { to: 'vampire'|'werewolf'|'ghost', amount: 'all'|number }
   * @returns {string} Detailed log of changes.
   */
  static applyTransformationEffect(gameData, value) {
    if (!gameData || !value) return "";

    if (value === 'vampire_bite') {
      return this.applyVampireBiteEffect(gameData);
    }
    if (value === 'werewolf_bite_row') {
      return this.applyWerewolfLineBiteEffect(gameData, 'row');
    }
    if (value === 'werewolf_bite_column') {
      return this.applyWerewolfLineBiteEffect(gameData, 'column');
    }
    if (value === 'give_up_ghost') {
      return this.applyGiveUpGhostEffect(gameData);
    }

    if (!value.to) return "";

    const targetRace = value.to; // 'vampire', 'werewolf', 'ghost'
    const amount = value.amount || 'all';

    // Find all regions with Bardaks
    let totalBardaksOnBoard = 0;
    const bardakRegions = [];

    gameData.regions.forEach(region => {
      const bCount = region.pawns.bardak?.length || 0;
      if (bCount > 0) {
        bardakRegions.push({ region, count: bCount });
        totalBardaksOnBoard += bCount;
      }
    });

    const targetRacePl = this.RACE_MAP_PL[targetRace] || targetRace;
    if (totalBardaksOnBoard === 0) {
      return `Transformacja: Brak Bardaków na planszy do przemiany w ${targetRacePl}.`;
    }

    // Determine how many to transform
    let toTransform = amount === 'all' ? totalBardaksOnBoard : Math.min(amount, totalBardaksOnBoard);
    let transformedCount = 0;
    const transformationLogs = [];

    for (const item of bardakRegions) {
      if (toTransform <= 0) break;

      const { region, count } = item;
      const numInRegion = Math.min(toTransform, count);

      const instancesToTransform = region.pawns.bardak.splice(0, numInRegion);
      if (region.pawns.bardak.length === 0) {
        delete region.pawns.bardak;
      }

      if (!region.pawns[targetRace]) {
        region.pawns[targetRace] = [];
      }

      instancesToTransform.forEach(instance => {
        region.pawns[targetRace].push({
          statuses: instance.statuses || ['ENABLED']
        });

        // Update total pool counts
        if (gameData.sets) {
          if (gameData.sets.pawns) {
            gameData.sets.pawns.bardak = Math.max(0, (gameData.sets.pawns.bardak || 0) - 1);
            gameData.sets.pawns[targetRace] = (gameData.sets.pawns[targetRace] || 0) + 1;
          }
          if (gameData.sets.pawnsInPlayLimit) {
            gameData.sets.pawnsInPlayLimit.bardak = Math.max(0, (gameData.sets.pawnsInPlayLimit.bardak || 0) - 1);
            gameData.sets.pawnsInPlayLimit[targetRace] = (gameData.sets.pawnsInPlayLimit[targetRace] || 0) + 1;
          }
        }
      });

      transformationLogs.push(`${numInRegion} at (${region.x},${region.y})`);
      transformedCount += numInRegion;
      toTransform -= numInRegion;
    }

    return `Transformacja: Przemieniono ${transformedCount} Bardaków w ${targetRacePl}: ${transformationLogs.join(', ')}. Ogólna pula Bardaków zmniejszona o ${transformedCount}, pula ${targetRacePl} zwiększona o ${transformedCount}.`;
  }

  /**
   * Applies the "Vampire Bite" transformation event.
   * In every sector with at least 1 Vampire and 1 Bardak, 1 Bardak transforms into a Vampire.
   * If any transformation occurred, Jakub's anger towards Bardaks drops to 0.
   * @param {Object} gameData - The full game data.
   * @returns {string} Detailed log of changes.
   */
  static applyVampireBiteEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const affectedRegions = [];
    let transformedCount = 0;

    gameData.regions.forEach(region => {
      const hasVampires = region.pawns.vampire && region.pawns.vampire.length > 0;
      const hasBardaks = region.pawns.bardak && region.pawns.bardak.length > 0;

      if (hasVampires && hasBardaks) {
        // Transform 1 Bardak to Vampire
        const instance = region.pawns.bardak.shift();
        if (region.pawns.bardak.length === 0) {
          delete region.pawns.bardak;
        }

        if (!region.pawns.vampire) {
          region.pawns.vampire = [];
        }
        region.pawns.vampire.push({
          statuses: instance.statuses || ['ENABLED']
        });

        // Update pools
        if (gameData.sets) {
          if (gameData.sets.pawns) {
            gameData.sets.pawns.bardak = Math.max(0, (gameData.sets.pawns.bardak || 0) - 1);
            gameData.sets.pawns.vampire = (gameData.sets.pawns.vampire || 0) + 1;
          }
          if (gameData.sets.pawnsInPlayLimit) {
            gameData.sets.pawnsInPlayLimit.bardak = Math.max(0, (gameData.sets.pawnsInPlayLimit.bardak || 0) - 1);
            gameData.sets.pawnsInPlayLimit.vampire = (gameData.sets.pawnsInPlayLimit.vampire || 0) + 1;
          }
        }

        transformedCount++;
        affectedRegions.push(`(${region.x},${region.y})`);
      }
    });

    if (transformedCount === 0) {
      return "Ugryzienie Wampira: Brak sektorów zawierających jednocześnie Wampiry i Bardaków. Brak transformacji.";
    }

    // Jakub pity effect
    let angerResetLog = "";
    const jakubRegion = gameData.regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    if (jakubRegion && jakubRegion.pawns.jakub && jakubRegion.pawns.jakub.length > 0) {
      const jakub = jakubRegion.pawns.jakub[0];
      const oldAnger = jakub.anger.bardak || 0;
      jakub.anger.bardak = 0;

      // Recalculate Range
      let extraRange = 0;
      Object.values(jakub.anger).forEach(val => {
        if (val >= 10) {
          extraRange += 1;
        }
      });
      const newRange = Math.min(5, 1 + extraRange);
      jakub.range = newRange;

      angerResetLog = `. Jakub ulitował się nad Bardakami: Furia wobec Bardaków zresetowana z ${oldAnger} do 0 (Zasięg Jakuba zaktualizowany do ${newRange})`;
    }

    return `Ugryzienie Wampira: Przemieniono 1 Bardaka w Wampira w sektorach ${affectedRegions.join(', ')} (Suma: ${transformedCount})${angerResetLog}.`;
  }

  /**
   * Applies the "Pack Infection (Row/Column)" transformation event.
   * Finds the line (row or column) with the most Werewolves and at least 1 Bardak.
   * Breaks ties by closest line to Jakub, then by fewest Bardaks.
   * If a line is found:
   *  - Transforms up to Werewolf count of Bardaks into Werewolves.
   *  - Redistributes all Werewolves in this line evenly across the 6 sectors.
   *  - Leftover Bardaks flee to Jakub's sector for help.
   *  - Resets Jakub's anger towards Bardaks to 0.
   * If no line is found:
   *  - Werewolf anger drops to 0, Bardak anger increases by 5.
   * @param {Object} gameData - The full game data.
   * @param {string} type - 'row' or 'column'
   * @returns {string} Detailed log of changes.
   */
  static applyWerewolfLineBiteEffect(gameData, type) {
    if (!gameData || !gameData.regions) return "";

    const jakubRegion = gameData.regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    if (!jakubRegion) {
      return `Zakażenie Watahy (${type === 'row' ? 'Wiersze' : 'Kolumny'}): Jakub nie jest na planszy.`;
    }

    const jx = jakubRegion.x;
    const jy = jakubRegion.y;
    const candidates = [];

    // Analyze each of the 6 lines (0 to 5)
    for (let i = 0; i < 6; i++) {
      const lineRegions = gameData.regions.filter(r => type === 'row' ? r.y === i : r.x === i);
      
      // Keep them sorted by ID to maintain left-to-right or top-to-bottom order
      lineRegions.sort((a, b) => a.id - b.id);

      let wCount = 0;
      let bCount = 0;
      lineRegions.forEach(r => {
        wCount += r.pawns.werewolf?.length || 0;
        bCount += r.pawns.bardak?.length || 0;
      });

      if (wCount > 0 && bCount > 0) {
        const dist = type === 'row' ? Math.abs(i - jy) : Math.abs(i - jx);
        candidates.push({
          index: i,
          wCount,
          bCount,
          dist,
          regions: lineRegions
        });
      }
    }

    // Recalculate Range helper
    const updateRange = (jakub) => {
      let extraRange = 0;
      Object.values(jakub.anger).forEach(val => {
        if (val >= 10) {
          extraRange += 1;
        }
      });
      jakub.range = Math.min(5, 1 + extraRange);
    };

    const jakub = jakubRegion.pawns.jakub[0];

    // Fallback if no matching rows/columns are found
    if (candidates.length === 0) {
      const oldWerewolfAnger = jakub.anger.werewolf || 0;
      const oldBardakAnger = jakub.anger.bardak || 0;

      jakub.anger.werewolf = 0;
      jakub.anger.bardak = (oldBardakAnger) + 5;
      updateRange(jakub);

      return `Zakażenie Watahy (${type === 'row' ? 'Wiersze' : 'Kolumny'}): Brak linii zawierających jednocześnie Wilkołaki i Bardaków. Furia Wilkołaków zresetowana do 0 (było ${oldWerewolfAnger}), furia Bardaków zwiększona do ${jakub.anger.bardak} (było ${oldBardakAnger}). Zasięg Jakuba zaktualizowany do ${jakub.range}.`;
    }

    // Find winning candidate
    let winner = candidates[0];
    for (let k = 1; k < candidates.length; k++) {
      const c = candidates[k];
      // Maximize Werewolf count
      if (c.wCount > winner.wCount) {
        winner = c;
      } else if (c.wCount === winner.wCount) {
        // Tiebreaker 1: Minimize distance to Jakub
        if (c.dist < winner.dist) {
          winner = c;
        } else if (c.dist === winner.dist) {
          // Tiebreaker 2: Minimize Bardaks count
          if (c.bCount < winner.bCount) {
            winner = c;
          }
        }
      }
    }

    // winning candidate regions
    const lineRegions = winner.regions;
    const wCount = winner.wCount;
    const bCount = winner.bCount;
    const numToTransform = Math.min(wCount, bCount);

    // Save and clear all original werewolf and bardak instances from line regions
    const originalWerewolves = [];
    const originalBardaks = [];
    
    lineRegions.forEach(r => {
      if (r.pawns.werewolf) {
        originalWerewolves.push(...r.pawns.werewolf);
        delete r.pawns.werewolf;
      }
      if (r.pawns.bardak) {
        originalBardaks.push(...r.pawns.bardak);
        delete r.pawns.bardak;
      }
    });

    // Transform Bardaks
    const transformedWerewolves = [];
    for (let k = 0; k < numToTransform; k++) {
      const originalBardak = originalBardaks[k];
      transformedWerewolves.push({
        statuses: originalBardak.statuses || ['ENABLED']
      });
    }

    // Update pools
    if (gameData.sets) {
      if (gameData.sets.pawns) {
        gameData.sets.pawns.bardak = Math.max(0, (gameData.sets.pawns.bardak || 0) - numToTransform);
        gameData.sets.pawns.werewolf = (gameData.sets.pawns.werewolf || 0) + numToTransform;
      }
      if (gameData.sets.pawnsInPlayLimit) {
        gameData.sets.pawnsInPlayLimit.bardak = Math.max(0, (gameData.sets.pawnsInPlayLimit.bardak || 0) - numToTransform);
        gameData.sets.pawnsInPlayLimit.werewolf = (gameData.sets.pawnsInPlayLimit.werewolf || 0) + numToTransform;
      }
    }

    // Fleeing Bardaks (those not transformed) run to Jakub's sector
    const fleeingCount = bCount - numToTransform;
    if (fleeingCount > 0) {
      if (!jakubRegion.pawns.bardak) {
        jakubRegion.pawns.bardak = [];
      }
      for (let k = numToTransform; k < bCount; k++) {
        jakubRegion.pawns.bardak.push(originalBardaks[k]);
      }
    }

    // Redistribute all Werewolves evenly across the 6 regions in the line
    const totalW = wCount + numToTransform;
    for (let idx = 0; idx < 6; idx++) {
      const countForThisRegion = Math.floor(totalW / 6) + (idx < (totalW % 6) ? 1 : 0);
      if (countForThisRegion > 0) {
        const targetR = lineRegions[idx];
        if (!targetR.pawns.werewolf) {
          targetR.pawns.werewolf = [];
        }
        for (let k = 0; k < countForThisRegion; k++) {
          // Take from original or transformed Werewolves
          const sourceArray = originalWerewolves.length > 0 ? originalWerewolves : transformedWerewolves;
          const inst = sourceArray.shift() || { statuses: ['ENABLED'] };
          targetR.pawns.werewolf.push(inst);
        }
      }
    }

    // Reset Jakub's anger towards Bardaks to 0
    const oldAnger = jakub.anger.bardak || 0;
    jakub.anger.bardak = 0;
    updateRange(jakub);

    const lineName = type === 'row' ? `Wiersz ${winner.index}` : `Kolumna ${winner.index}`;
    return `Zakażenie Watahy (${type === 'row' ? 'Wiersze' : 'Kolumny'}): Wybrana linia to ${lineName} z liczbą Wilkołaków: ${wCount}. Przemieniono ${numToTransform} Bardaków. ${fleeingCount} Bardaków uciekło do Jakuba na (${jx},${jy}). Rozdzielono ${totalW} Wilkołaków równomiernie. Furia wobec Bardaków zresetowana z ${oldAnger} do 0 (Zasięg Jakuba zaktualizowany do ${jakub.range}).`;
  }

  /**
   * Applies the "Give up the Ghost" transformation event.
   * Look for any border sector with only Bardaks.
   * One of those Bardaks ("wyzionął ducha") transforms into a Ghost.
   * Decreases Bardak total count, increases Ghost total count.
   * If any transformation occurred, Jakub's anger towards Bardaks drops to 0.
   * If no transformation occurred, anger for Bardaks increases by 5.
   * @param {Object} gameData - The full game data.
   * @returns {string} Detailed log of changes.
   */
  static applyGiveUpGhostEffect(gameData) {
    if (!gameData || !gameData.regions) return "";

    const affectedRegions = [];
    let transformedCount = 0;

    gameData.regions.forEach(region => {
      // Check if it is a border sector (region)
      const isBorder = region.x === 0 || region.x === 5 || region.y === 0 || region.y === 5;
      if (!isBorder) return;

      // Check if there are Bardaks and no other pawns/Jakub
      const hasBardaks = region.pawns.bardak && region.pawns.bardak.length > 0;
      const hasOtherPawns = Object.entries(region.pawns).some(([key, val]) => key !== 'bardak' && val && val.length > 0);
      const onlyBardaks = hasBardaks && !hasOtherPawns;

      if (onlyBardaks) {
        // Transform 1 Bardak to Ghost ("wyzionął ducha")
        const instance = region.pawns.bardak.shift();
        if (region.pawns.bardak.length === 0) {
          delete region.pawns.bardak;
        }

        if (!region.pawns.ghost) {
          region.pawns.ghost = [];
        }
        region.pawns.ghost.push({
          statuses: instance.statuses || ['ENABLED']
        });

        // Update pools
        if (gameData.sets) {
          if (gameData.sets.pawns) {
            gameData.sets.pawns.bardak = Math.max(0, (gameData.sets.pawns.bardak || 0) - 1);
            gameData.sets.pawns.ghost = (gameData.sets.pawns.ghost || 0) + 1;
          }
          if (gameData.sets.pawnsInPlayLimit) {
            gameData.sets.pawnsInPlayLimit.bardak = Math.max(0, (gameData.sets.pawnsInPlayLimit.bardak || 0) - 1);
            gameData.sets.pawnsInPlayLimit.ghost = (gameData.sets.pawnsInPlayLimit.ghost || 0) + 1;
          }
        }

        transformedCount++;
        affectedRegions.push(`(${region.x},${region.y})`);
      }
    });

    let angerLog = "";
    const jakubRegion = gameData.regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    if (jakubRegion && jakubRegion.pawns.jakub && jakubRegion.pawns.jakub.length > 0) {
      const jakub = jakubRegion.pawns.jakub[0];
      const oldAnger = jakub.anger.bardak || 0;

      // Recalculate Range helper
      const updateRange = (j) => {
        let extraRange = 0;
        Object.values(j.anger).forEach(val => {
          if (val >= 10) {
            extraRange += 1;
          }
        });
        j.range = Math.min(5, 1 + extraRange);
      };

      if (transformedCount > 0) {
        jakub.anger.bardak = 0;
        updateRange(jakub);
        angerLog = `. Jakub ulitował się nad Bardakami: Furia wobec Bardaków zresetowana z ${oldAnger} do 0 (Zasięg Jakuba zaktualizowany do ${jakub.range})`;
      } else {
        jakub.anger.bardak = oldAnger + 5;
        updateRange(jakub);
        angerLog = `. Bardakom nie udało się wyzionąć ducha: Furia wobec Bardaków zwiększona z ${oldAnger} do ${jakub.anger.bardak} (Zasięg Jakuba zaktualizowany do ${jakub.range})`;
      }
    }

    if (transformedCount === 0) {
      return `Wyzionąć Ducha: Brak sektorów granicznych zawierających wyłącznie Bardaków. Brak transformacji${angerLog}.`;
    }

    return `Wyzionąć Ducha: Przemieniono 1 Bardaka w Ducha w sektorach granicznych ${affectedRegions.join(', ')} (Suma: ${transformedCount})${angerLog}.`;
  }
}
