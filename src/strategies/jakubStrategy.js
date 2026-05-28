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

  // 1. Before move, kill everyone in his current region that he has anger towards.
  // For every pawn killed this way, decrease proper anger.
  let killedInfo = [];
  RACES.forEach(race => {
    const units = currentRegion.pawns[race]?.length || 0;
    const angerVal = jakub.anger[race] || 0;
    if (units > 0 && angerVal > 0) {
      const playerIdx = workState.players.findIndex(p => p.generalOf === race);
      if (playerIdx !== -1) {
        workState.players[playerIdx].points = Math.max(0, workState.players[playerIdx].points - units);
      }
      
      jakub.anger[race] = Math.max(0, angerVal - units);
      delete currentRegion.pawns[race];
      killedInfo.push({ race, count: units });
    }
  });

  if (killedInfo.length > 0) {
    const logStr = `Jakub targets his region at [${currentRegion.x},${currentRegion.y}] and kills everyone he is angry at: ` +
      killedInfo.map(info => `${info.count} ${info.race}(s)`).join(', ') + '.';
    return {
      newState: workState,
      actionTaken: true,
      log: logStr,
      metadata: { killedInfo }
    };
  }

  // 2. If no targets left to kill in the current region, proceed to move.
  // Determine priority list based on current anger (tie-broken V -> W -> G -> B)
  const sortedAnger = RACES
    .map(race => ({ race, val: jakub.anger[race] || 0 }))
    .filter(a => a.val > 0)
    .sort((a, b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race));

  if (sortedAnger.length === 0) {
    return { newState: workState, actionTaken: false, log: "Jakub's anger is gone. Rampage ends." };
  }

  const targetRace = sortedAnger[0].race;

  // Calculate dynamic movement range: Range = 1 + (number of races with anger >= 10)
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
    // If no target in range, rampage ends
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
  
  // Set the movedThisRound flag!
  targetRegion.pawns.jakub[0].movedThisRound = true;
  targetRegion.pawns.jakub[0].range = calculatedRange;

  return { 
    newState: workState, 
    actionTaken: true, 
    log: `Jakub moves to [${targetRegion.x},${targetRegion.y}] within range ${calculatedRange} to chase ${targetRace}.` 
  };
};
