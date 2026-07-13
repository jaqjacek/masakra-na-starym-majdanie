import { RACES } from '../constants/game';
import { JAKUB_ANGER_THRESHOLD, JAKUB_BASE_RANGE } from '../constants/constants';
import { trackPointsChange, trackJakubKills } from '../../shared/statsManager.js';

const RACE_MAP_PL = { 'vampire': 'Wampiry', 'werewolf': 'Wilkołaki', 'ghost': 'Duchy', 'bardak': 'Bardaki' };

/**
 * Updates Jakub's anger based on set contents and handles overflow logic.
 */
export const applySetToJakubAnger = (jakub, setContent) => {
  const newAnger = { ...jakub.anger };

  Object.entries(setContent).forEach(([race, count]) => {
    if (newAnger[race] !== undefined) {
      newAnger[race] += count;
    }
  });

  // Rule: Range = Base + (number of races with anger >= threshold)
  let extraRange = 0;
  Object.values(newAnger).forEach(val => {
    if (val >= JAKUB_ANGER_THRESHOLD) {
      extraRange += 1;
    }
  });

  return { anger: newAnger, range: Math.min(5, JAKUB_BASE_RANGE + extraRange) };
};

export const getRegionsInRange = (regions, startIndex, range) => {
  const inRange = new Set();
  const queue = [{ index: startIndex, dist: 0 }];
  const visited = new Set([startIndex]);

  while (queue.length > 0) {
    const { index, dist } = queue.shift();
    inRange.add(index);
    if (dist < range) {
      regions[index].neighbors.forEach(nIdx => {
        if (!visited.has(nIdx)) {
          visited.add(nIdx);
          queue.push({ index: nIdx, dist: dist + 1 });
        }
      });
    }
  }
  return Array.from(inRange);
};



/**
 * Helper to calculate and award witness points for pawns of races where Jakub's anger is 0 in a specific region.
 */
const awardWitnessPoints = (workState, region, jakub) => {
  const swiadekPointsAwarded = [];
  RACES.forEach(race => {
    const count = region.pawns[race]?.length || 0;
    if (count > 0 && (jakub.anger[race] || 0) === 0) {
      const playerIdx = workState.players.findIndex(p => p.generalOf === race);
      const pts = count * 1;
      if (playerIdx !== -1) {
        const p = workState.players[playerIdx];
        p.points += pts;
        trackPointsChange(p, race, pts, 'witness');
        swiadekPointsAwarded.push({ race, count, points: pts, player: `P${p.id}`, regionId: region.id });
        
        if (!workState.witnessGlows) workState.witnessGlows = {};
        if (!workState.witnessGlows[region.id]) workState.witnessGlows[region.id] = [];
        if (!workState.witnessGlows[region.id].includes(race)) workState.witnessGlows[region.id].push(race);
      }
    }
  });
  return swiadekPointsAwarded;
};

/**
 * Executes ONE step of Jakub's turn (either kill or move).
 */
export const executeJakubStep = (gameState) => {
  let workState = JSON.parse(JSON.stringify(gameState));
  
  let jakub = null;
  let currentRegion = null;
  for (const r of workState.regions) {
    if (r.pawns.jakub?.length > 0) {
      jakub = r.pawns.jakub[0];
      currentRegion = r;
      break;
    }
  }

  if (!jakub) return { newState: workState, actionTaken: false, log: "Nie znaleziono Jakuba." };

  // 1. Before move, kill exactly ONE eligible pawn in his current region per tick.
  // This satisfies the "Pionki są zabijane pojedyńczo w odstępie czasu ticka" rule.
  let killedInfo = [];
  for (const race of RACES) {
    const units = currentRegion.pawns[race]?.length || 0;
    const angerVal = jakub.anger[race] || 0;
    if (units > 0 && angerVal > 0) {
      const toKill = 1; // Only kill 1 at a time!
      const playerIdx = workState.players.findIndex(p => p.generalOf === race);
      if (playerIdx !== -1) {
        const p = workState.players[playerIdx];
        const prevPoints = p.points;
        p.points = Math.max(0, p.points - toKill);
        const actualLoss = prevPoints - p.points;
        if (actualLoss > 0) {
          trackPointsChange(p, race, -actualLoss, 'czystka');
        }
        trackJakubKills(p, race, toKill);
      }
      
      jakub.anger[race] -= toKill;
      currentRegion.pawns[race] = currentRegion.pawns[race].slice(toKill);
      if (currentRegion.pawns[race].length === 0) {
        delete currentRegion.pawns[race];
      }
      killedInfo.push({ race, count: toKill });
      break; // Stop after 1 kill to advance state and wait for next tick!
    }
  }


  if (killedInfo.length > 0) {
    const logStr = `Jakub zabija pionka w sektorze [${currentRegion.x},${currentRegion.y}]: ` +
      killedInfo.map(info => `${info.count} x ${RACE_MAP_PL[info.race] || info.race}`).join(', ') + '.';
    return {
      newState: workState,
      actionTaken: true,
      log: logStr,
      metadata: { killedInfo }
    };
  }

  // Handle pending magnetism pull from previous tick
  if (workState.jakubMagnetismPending) {
    const magnetismResult = handleMagnetism(workState, currentRegion, workState.jakubMagnetismPending);
    workState.magnetismPullRegions = workState.jakubMagnetismPending.map(rIdx => workState.regions[rIdx].id);
    delete workState.jakubMagnetismPending;
    
    return {
      newState: workState,
      actionTaken: true,
      log: magnetismResult.log,
      metadata: { magnetismPull: true, sourceRegions: workState.magnetismPullRegions }
    };
  } else {
    delete workState.magnetismPullRegions;
  }

  // 2. If no targets left to kill in the current region, proceed to move.
  // Build anger tiers for the new cascading tie-breaker
  const angerTiers = buildAngerTiers(jakub);

  if (angerTiers.length === 0) {
    const swiadekPointsAwarded = awardWitnessPoints(workState, currentRegion, jakub);

    let swiadekLogStr = "";
    if (swiadekPointsAwarded.length > 0) {
      swiadekLogStr = ` Punkty Świadka Jakuba przyznane: ` + 
        swiadekPointsAwarded.map(r => `${r.player} (${RACE_MAP_PL[r.race] || r.race}) +${r.points} pkt`).join(', ') + '.';
    }

    return { 
      newState: workState, 
      actionTaken: false, 
      log: `Furia Jakuba opadła. Łowy zakończone.${swiadekLogStr}`,
      metadata: { swiadekPointsAwarded }
    };
  }

  // Calculate dynamic movement range: Range = 1 + (number of races with anger >= 10)
  let extraRange = 0;
  RACES.forEach(race => {
    if ((jakub.anger[race] || 0) >= 10) {
      extraRange += 1;
    }
  });
  const calculatedRange = 1 + extraRange;
  
  // Find all candidate region indices in range
  const allCandidates = getRegionsInRange(workState.regions, currentRegion.id, calculatedRange);
  
  // Flatten anger tiers into ordered race list for candidate filtering
  const flatRaceOrder = angerTiers.flatMap(tier => tier.races);

  // First, find candidate regions that have ANY pawns of ANY race Jakub has anger towards
  let validCandidates = allCandidates.filter(rIdx => 
    flatRaceOrder.some(race => (workState.regions[rIdx].pawns[race]?.length || 0) > 0)
  );

  if (validCandidates.length === 0) {
    // If no target in range, rampage ends. Award witness points in current region
    const swiadekPointsAwarded = awardWitnessPoints(workState, currentRegion, jakub);

    let swiadekLogStr = "";
    if (swiadekPointsAwarded.length > 0) {
      swiadekLogStr = ` Punkty Świadka Jakuba przyznane: ` + 
        swiadekPointsAwarded.map(r => `${r.player} (${RACE_MAP_PL[r.race] || r.race}) +${r.points} pkt`).join(', ') + '.';
    }

    return { 
      newState: workState, 
      actionTaken: false, 
      log: `Jakub nie znalazł żadnej bandy w zasięgu ${calculatedRange}. Łowy zakończone.${swiadekLogStr}`,
      metadata: { swiadekPointsAwarded }
    };
  }

  // Apply cascading tie-breaker
  const cascadeResult = cascadeTieBreak(workState.regions, validCandidates, angerTiers);

  if (cascadeResult.magnetism) {
    workState.jakubMagnetismPending = cascadeResult.tiedRegions;
    const cascadeLogStr = cascadeResult.log.join(' ');
    const magnetismLog = `⚡ Zbliża się NIEPOCHAMOWANY ZWIERZĘCY MAGNETYZM!`;
    const finalLog = `${cascadeLogStr} ${magnetismLog}`;
    
    return {
      newState: workState,
      actionTaken: true,
      log: finalLog,
      metadata: { magnetismStart: true, regionId: currentRegion.id }
    };
  }

  // Normal move — cascade resolved to a single winner. Award witness points because Jakub is leaving this region
  const swiadekPointsAwarded = awardWitnessPoints(workState, currentRegion, jakub);

  let swiadekLogStr = "";
  if (swiadekPointsAwarded.length > 0) {
    swiadekLogStr = ` Punkty Świadka Jakuba przyznane: ` + 
      swiadekPointsAwarded.map(r => `${r.player} (${RACE_MAP_PL[r.race] || r.race}) +${r.points} pkt`).join(', ') + '.';
  }

  const bestRIdx = cascadeResult.winner;
  const targetRegion = workState.regions[bestRIdx];

  if (!workState.jakubPath) workState.jakubPath = [];
  workState.jakubPath.push({
    from: currentRegion.id,
    to: targetRegion.id,
    round: workState.currentRound,
    phase: workState.phase
  });

  targetRegion.pawns.jakub = currentRegion.pawns.jakub;
  delete currentRegion.pawns.jakub;
  
  // Set the movedThisRound flag!
  targetRegion.pawns.jakub[0].movedThisRound = true;
  targetRegion.pawns.jakub[0].range = calculatedRange;

  // Determine primary target race for logging (first race in flatRaceOrder that exists in chosen region)
  const primaryTargetRace = flatRaceOrder.find(race => (targetRegion.pawns[race]?.length || 0) > 0) || flatRaceOrder[0];
  const targetCount = targetRegion.pawns[primaryTargetRace]?.length || 0;

  const cascadeLogStr = cascadeResult.log.length > 0 ? ` ${cascadeResult.log.join(' ')}` : '';
  const finalLog = `Jakub przemieszcza się na [${targetRegion.x},${targetRegion.y}] w zasięgu ${calculatedRange}, ścigając ${RACE_MAP_PL[primaryTargetRace] || primaryTargetRace} (Furia: ${jakub.anger[primaryTargetRace] || 0} | Region zawiera ${targetCount} jednostek).${cascadeLogStr}${swiadekLogStr}`;

  return { 
    newState: workState, 
    actionTaken: true, 
    log: finalLog,
    metadata: { swiadekPointsAwarded }
  };
};


/**
 * Groups races by anger value into descending tiers, ordered within each tier by hierarchy (V→W→G→B).
 * Only includes races with anger > 0.
 * 
 * Example: anger = { vampire: 4, werewolf: 5, ghost: 4, bardak: 5 }
 * Returns: [{ anger: 5, races: ['werewolf', 'bardak'] }, { anger: 4, races: ['vampire', 'ghost'] }]
 */
export const buildAngerTiers = (jakub) => {
  const angerEntries = RACES
    .map(race => ({ race, val: jakub.anger[race] || 0 }))
    .filter(a => a.val > 0);

  if (angerEntries.length === 0) return [];

  // Group by anger value
  const tierMap = {};
  angerEntries.forEach(({ race, val }) => {
    if (!tierMap[val]) tierMap[val] = [];
    tierMap[val].push(race);
  });

  // Sort tiers by anger descending, races within each tier already in RACES (hierarchy) order
  return Object.entries(tierMap)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([anger, races]) => ({ anger: Number(anger), races }));
};


/**
 * Cascading tie-breaker: narrows candidate regions through each race in tier order.
 * 
 * For each race (in anger-tier order, highest first, hierarchy within each tier):
 *   - Count that race's pawns in each remaining candidate region
 *   - Keep ONLY the regions with the MAX count of that race
 *   - If 1 region remains → winner
 *   - If still tied → continue to next race
 * 
 * If ALL races exhausted and still tied → magnetism triggers.
 * 
 * Returns: { winner: regionIndex | null, magnetism: boolean, tiedRegions: [...], log: string[] }
 */
export const cascadeTieBreak = (regions, candidates, angerTiers) => {
  let remaining = [...candidates];
  const log = [];

  if (remaining.length === 1) {
    return { winner: remaining[0], magnetism: false, tiedRegions: [], log };
  }

  const flatRaces = angerTiers.flatMap(tier => tier.races);

  // Find the first race that has any pawns in candidates — this is the "primary target race"
  // We first narrow by: for each candidate, does it have the target race?
  // Start by finding candidates that have the first available race
  let initialTargetRace = null;
  for (const race of flatRaces) {
    const hasRace = remaining.filter(rIdx => (regions[rIdx].pawns[race]?.length || 0) > 0);
    if (hasRace.length > 0) {
      initialTargetRace = race;
      remaining = hasRace;
      break;
    }
  }

  if (!initialTargetRace) {
    return { winner: remaining[0], magnetism: false, tiedRegions: [], log };
  }

  if (remaining.length === 1) {
    return { winner: remaining[0], magnetism: false, tiedRegions: [], log };
  }

  // Now apply cascading tie-break: for the initial target race, pick max count
  // then continue with all other races in tier order
  log.push(`Rozstrzyganie remisu w zasięgu:`);

  for (const race of flatRaces) {
    const counts = remaining.map(rIdx => ({
      rIdx,
      count: regions[rIdx].pawns[race]?.length || 0
    }));
    
    const maxCount = Math.max(...counts.map(c => c.count));
    const maxRegions = counts.filter(c => c.count === maxCount);
    
    const tierEntry = angerTiers.find(t => t.races.includes(race));
    const angerVal = tierEntry ? tierEntry.anger : 0;
    
    const regionStrs = counts.map(c => `[${regions[c.rIdx].x},${regions[c.rIdx].y}]=${c.count}`).join(', ');
    
    if (maxRegions.length === 1) {
      // This race broke the tie!
      log.push(`${RACE_MAP_PL[race] || race} (Furia: ${angerVal}): ${regionStrs} → rozstrzygnięto!`);
      return { winner: maxRegions[0].rIdx, magnetism: false, tiedRegions: [], log };
    }
    
    // Still tied — narrow candidates and continue
    log.push(`${RACE_MAP_PL[race] || race} (Furia: ${angerVal}): ${regionStrs} → remis`);
    remaining = maxRegions.map(c => c.rIdx);
  }

  // All races exhausted — absolute tie → magnetism!
  const tiedRegionStrs = remaining.map(rIdx => `[${regions[rIdx].x},${regions[rIdx].y}]`).join(' i ');
  log.push(`⚡ NIEPOCHAMOWANY ZWIERZĘCY MAGNETYZM! (Tego nie pochamujesz) Wszystkie bandy z sektorów ${tiedRegionStrs} przyciągnięte do sektora Jakuba!`);
  
  return { winner: null, magnetism: true, tiedRegions: remaining, log };
};


/**
 * Handles the "Niepochamowany Zwierzęcy Magnetyzm" mechanic:
 * Moves ALL pawns (every race) from all tied regions to Jakub's current region.
 * Jakub does NOT move — next step will process kills in his own region.
 */
const handleMagnetism = (workState, jakubRegion, tiedRegionIndices) => {
  const pulledInfo = [];
  
  tiedRegionIndices.forEach(rIdx => {
    const region = workState.regions[rIdx];
    RACES.forEach(race => {
      const pawns = region.pawns[race];
      if (pawns && pawns.length > 0) {
        // Move pawns to Jakub's region
        if (!jakubRegion.pawns[race]) {
          jakubRegion.pawns[race] = [];
        }
        jakubRegion.pawns[race].push(...pawns);
        pulledInfo.push({ race, count: pawns.length, from: `[${region.x},${region.y}]` });
        delete region.pawns[race];
      }
    });
  });

  const pulledStr = pulledInfo.length > 0
    ? pulledInfo.map(p => `${p.count}x ${RACE_MAP_PL[p.race] || p.race} z ${p.from}`).join(', ')
    : 'brak jednostek do przyciągnięcia';

  return {
    log: `Przyciągnięto do sektora [${jakubRegion.x},${jakubRegion.y}]: ${pulledStr}.`
  };
};
