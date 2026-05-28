import { RACES } from '../constants/game';
import { JAKUB_ANGER_THRESHOLD, JAKUB_BASE_RANGE } from '../constants/constants';

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

const getRegionsInRange = (regions, startIndex, range) => {
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

  if (!jakub) return { newState: workState, actionTaken: false, log: "Jakub not found." };

  // 1. Determine target race (highest anger, tie-broken V -> W -> G -> B)
  const sortedAnger = RACES
    .map(race => ({ race, val: jakub.anger[race] || 0 }))
    .filter(a => a.val > 0)
    .sort((a, b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race));

  if (sortedAnger.length === 0) {
    return { newState: workState, actionTaken: false, log: "Jakub's anger is gone." };
  }

  const targetRace = sortedAnger[0].race;

  // 2. Try to KILL target race in current region
  const units = currentRegion.pawns[targetRace]?.length || 0;
  if (units > 0) {
    const killCount = Math.min(units, jakub.anger[targetRace]);
    const playerIdx = workState.players.findIndex(p => p.generalOf === targetRace);
    if (playerIdx !== -1) {
      workState.players[playerIdx].points = Math.max(0, workState.players[playerIdx].points - killCount);
    }
    
    jakub.anger[targetRace] -= killCount;
    currentRegion.pawns[targetRace].splice(0, killCount);
    if (currentRegion.pawns[targetRace].length === 0) delete currentRegion.pawns[targetRace];

    return { 
      newState: workState, 
      actionTaken: true, 
      log: `Jakub targets ${targetRace} and kills ${killCount} unit(s) at [${currentRegion.x},${currentRegion.y}]. (-${killCount} pts)`,
      metadata: { race: targetRace, points: -killCount }
    };
  }

  // 3. Move search
  // Calculate range: default 1 + 1 for every race that still has anger >= 10
  let extraRange = 0;
  RACES.forEach(race => {
    if ((jakub.anger[race] || 0) >= 10) {
      extraRange += 1;
    }
  });
  const calculatedRange = 1 + extraRange;
  
  // Find all candidate region indices in range
  const candidates = getRegionsInRange(workState.regions, currentRegion.id, calculatedRange);
  
  // Filter candidates to those containing targetRace units
  const validCandidates = candidates.filter(rIdx => 
    (workState.regions[rIdx].pawns[targetRace]?.length || 0) > 0
  );

  if (validCandidates.length === 0) {
    // If no target in range then he just stops and his phase ends
    return { 
      newState: workState, 
      actionTaken: false, 
      log: `Jakub could not find target ${targetRace} in range ${calculatedRange}. Rampage ends.` 
    };
  }

  // Pick best region: highest number of units of targetRace, tie-break by proximity/discovery order
  let bestRIdx = validCandidates[0];
  let maxCount = -1;
  validCandidates.forEach(rIdx => {
    const count = workState.regions[rIdx].pawns[targetRace]?.length || 0;
    if (count > maxCount) {
      maxCount = count;
      bestRIdx = rIdx;
    }
  });

  const targetRegion = workState.regions[bestRIdx];
  targetRegion.pawns.jakub = currentRegion.pawns.jakub;
  delete currentRegion.pawns.jakub;
  
  // Update range to calculated range for metadata visibility
  jakub.range = calculatedRange;

  return { 
    newState: workState, 
    actionTaken: true, 
    log: `Jakub moves to [${targetRegion.x},${targetRegion.y}] within range ${calculatedRange} to chase ${targetRace}.` 
  };
};
