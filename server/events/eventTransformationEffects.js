import { RACE_MAP, RACE_MAP_PL } from '../eventConstants.js';
import { computeJakubRange } from '../../shared/constants.js';

export class EventTransformationEffects {
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

    const targetRacePl = RACE_MAP_PL[targetRace] || targetRace;
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

      const newRange = computeJakubRange(jakub.anger);
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

    const updateRange = (jakub) => {
      jakub.range = computeJakubRange(jakub.anger);
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

      const updateRange = (j) => {
        j.range = computeJakubRange(j.anger);
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
