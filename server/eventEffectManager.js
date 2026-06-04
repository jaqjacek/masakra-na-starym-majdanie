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
        logs.push(`${raceName}: ${oldAnger} -> ${newAnger}`);
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

    return logs.length > 0 ? `Anger changes: ${logs.join(', ')} (Range updated to ${newRange})` : "No anger changes occurred.";
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
        logs.push(`${raceName}: ${oldLimit} -> ${newLimit}`);
      }
    });

    return logs.length > 0 ? `Pawn limit changes: ${logs.join(', ')}` : "No pawn limit changes occurred.";
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
        logs.push(`${count} ${raceId}s at (${target.x},${target.y})`);
      });
    });

    if (logs.length === 0) return "Wipe sectors: No pawns were affected.";

    const penaltyLogs = Object.entries(penaltyMap).map(([name, lost]) => `${name}: -${lost} pts`);
    return `Wipe sectors: Removed ${logs.join(', ')}. Penalties: ${penaltyLogs.join(', ')}`;
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
      ? `Support: Distributed ${count} extra set(s) to each player (Total: ${totalDistributed}).`
      : "Support: No sets available to distribute.";
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

    if (!value.from || !value.to) return "";

    const { from, to } = value;
    const regionFrom = gameData.regions.find(r => r.x === from.x && r.y === from.y);
    const regionTo = gameData.regions.find(r => r.x === to.x && r.y === to.y);

    if (!regionFrom || !regionTo) {
      return `Move Event: Invalid sectors specified (From: (${from.x},${from.y}) or To: (${to.x},${to.y}) not found).`;
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

      movedLogs.push(`${count} ${raceId}s`);
      totalMoved += count;
    });

    if (totalMoved === 0) {
      return `Move Event: No pawns found at (${from.x},${from.y}) to move to (${to.x},${to.y}).`;
    }

    return `Move Event: Moved ${movedLogs.join(', ')} from (${from.x},${from.y}) to (${to.x},${to.y}).`;
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
      return "Charge Event: No pawns were on the border sectors to charge.";
    }

    return `Charge Event: Moved ${totalMoved} pawns from border sectors ${borderCoordinatesLog.join(', ')} closer to the center.`;
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
      return "Mental Force Field Event: Jakub is not on the board.";
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
            movedLogs.push(`${count} ${raceId}s at (${region.x},${region.y}) -> (${destX},${destY})`);
          } else {
            killsToMake.push({
              fromRegion: region,
              raceId: raceId,
              instances: [...instances]
            });
            killedLogs.push(`${count} ${raceId}s at (${region.x},${region.y}) (killed)`);
          }
        } else {
          killsToMake.push({
            fromRegion: region,
            raceId: raceId,
            instances: [...instances]
          });
          killedLogs.push(`${count} ${raceId}s at (${region.x},${region.y}) (killed)`);
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
      return "Mental Force Field Event: No pawns were at distance 1 from Jakub.";
    }

    const logs = [];
    if (movedLogs.length > 0) {
      logs.push(`Moved: ${movedLogs.join(', ')}`);
    }
    if (killedLogs.length > 0) {
      logs.push(`Killed: ${killedLogs.join(', ')}`);
    }
    if (Object.keys(penaltyMap).length > 0) {
      const penaltyLogs = Object.entries(penaltyMap).map(([name, lost]) => `${name}: -${lost} pts`);
      logs.push(`Penalties: ${penaltyLogs.join(', ')}`);
    }

    return `Mental Force Field Event: ${logs.join('. ')}`;
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
          movedLogs.push(`${count} Bardaks at (${region.x},${region.y}) -> (${winner.x},${winner.y})`);
          totalMoved += count;
        } else {
          // Runaway from battlefield
          runawayLogs.push(`${count} Bardaks at (${region.x},${region.y})`);
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
      return "Bardak Cowardice Event: No sectors with lonely Bardaks were found.";
    }

    const logs = [];
    if (movedLogs.length > 0) {
      logs.push(`Fled: ${movedLogs.join(', ')}`);
    }
    if (runawayLogs.length > 0) {
      logs.push(`Deserted: ${runawayLogs.join(', ')}`);
    }
    if (totalPenalties > 0) {
      logs.push(`Penalties: Bardak general lost ${totalPenalties} pts`);
    }

    return `Bardak Cowardice Event: ${logs.join('. ')}`;
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
      return "Jakub's Gravity Event: Jakub is not on the board.";
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
          movedLogs.push(`${count} ${raceId}s at (${region.x},${region.y}) -> (${destX},${destY})`);
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
      return "Jakub's Gravity Event: No pawns were at distance 3 or more from Jakub.";
    }

    return `Jakub's Gravity Event: Pulled ${totalMoved} pawns closer to Jakub: ${movedLogs.join(', ')}`;
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
      return "Crimson Convergence Event: Jakub is not on the board.";
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
      return "Crimson Convergence Event: No Vampires were found on the board outside of Jakub's sector.";
    }

    return `Crimson Convergence Event: Relocated ${totalMoved} Vampires from sectors ${sourceSectorsLog.join(', ')} to Jakub's sector at (${jakubRegion.x},${jakubRegion.y}).`;
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
      return "Alpha's Call Event: No Werewolves were found on the board.";
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
      return `Alpha's Call Event: Main pack is at (${tx},${ty}) [${maxWerewolves} Werewolves], but no lonely Werewolves were found to pull.`;
    }

    return `Alpha's Call Event: Main pack is at (${tx},${ty}) [${maxWerewolves} Werewolves]. Pulled ${totalMoved} lonely Werewolves closer: ${movedLogs.join(', ')}.`;
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
      return "Lunar Alignment Event: No lonely Werewolves were found on the board.";
    }

    if (packRegions.length === 0) {
      return "Lunar Alignment Event: No Werewolf packs (2+ Werewolves in a sector) were found to draw lonely units.";
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
        movedLogs.push(`(${region.x},${region.y}) -> (${destX},${destY}) toward pack at (${targetPack.x},${targetPack.y})`);
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
      return "Lunar Alignment Event: Couldn't relocate any lonely Werewolves closer to packs.";
    }

    return `Lunar Alignment Event: Consolidated ${totalMoved} lonely Werewolves closer to established packs: ${movedLogs.join(', ')}.`;
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

    if (totalBardaksOnBoard === 0) {
      return `Transformation Event: No Bardaks were found on the board to transform into ${targetRace}s.`;
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

    return `Transformation Event: Transformed ${transformedCount} Bardaks into ${targetRace}s: ${transformationLogs.join(', ')}. Bardak total pool decreased by ${transformedCount}, ${targetRace} pool increased by ${transformedCount}.`;
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
      return "Vampire Bite Event: No sectors contained both Vampires and Bardaks. No transformations occurred.";
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

      angerResetLog = `. Jakub took pity on the Bardaks: Anger towards Bardaks reset from ${oldAnger} to 0 (Jakub's Range updated to ${newRange})`;
    }

    return `Vampire Bite Event: Transformed 1 Bardak into a Vampire in sectors ${affectedRegions.join(', ')} (Total: ${transformedCount})${angerResetLog}.`;
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
      return `Pack Infection (${type === 'row' ? 'Rows' : 'Columns'}) Event: Jakub is not on the board.`;
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

      return `Pack Infection (${type === 'row' ? 'Rows' : 'Columns'}) Event: No matching lines contained both Werewolves and Bardaks. Werewolf anger reset to 0 (was ${oldWerewolfAnger}), Bardak anger increased to ${jakub.anger.bardak} (was ${oldBardakAnger}). Jakub's Range updated to ${jakub.range}.`;
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

    const lineName = type === 'row' ? `Row ${winner.index}` : `Column ${winner.index}`;
    return `Pack Infection (${type === 'row' ? 'Rows' : 'Columns'}) Event: Winner is ${lineName} with ${wCount} Werewolves. Transformed ${numToTransform} Bardaks. ${fleeingCount} Bardaks fled to Jakub at (${jx},${jy}). Distributed ${totalW} Werewolves evenly. Anger towards Bardaks reset from ${oldAnger} to 0 (Jakub's Range updated to ${jakub.range}).`;
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
        angerLog = `. Jakub took pity on the Bardaks: Anger towards Bardaks reset from ${oldAnger} to 0 (Jakub's Range updated to ${jakub.range})`;
      } else {
        jakub.anger.bardak = oldAnger + 5;
        updateRange(jakub);
        angerLog = `. Bardaks failed to die properly: Anger towards Bardaks increased from ${oldAnger} to ${jakub.anger.bardak} (Jakub's Range updated to ${jakub.range})`;
      }
    }

    if (transformedCount === 0) {
      return `Give up the Ghost Event: No border sectors contained only Bardaks. No transformations occurred${angerLog}.`;
    }

    return `Give up the Ghost Event: Transformed 1 Bardak into a Ghost in border sectors ${affectedRegions.join(', ')} (Total: ${transformedCount})${angerLog}.`;
  }
}
