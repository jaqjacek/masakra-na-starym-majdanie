export const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];

/**
 * Updates Jakub's anger based on set contents and handles overflow logic.
 * Overflow: If any race's anger reaches or exceeds 10, it resets to 5 and Range increases by 1.
 */
export const applySetToJakubAnger = (jakub, setContent) => {
  const newAnger = { ...jakub.anger };

  Object.entries(setContent).forEach(([race, count]) => {
    if (newAnger[race] !== undefined) {
      newAnger[race] += count;
    }
  });

  let extraRange = 0;
  Object.values(newAnger).forEach(val => {
    if (val > 9) {
      extraRange += (val - 9);
    }
  });

  return { anger: newAnger, range: 1 + extraRange };
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

const getBestTargetRegion = (candidateIndices, priorityRaces, regions) => {
  if (candidateIndices.length === 0) return null;
  let tied = candidateIndices;

  for (const race of priorityRaces) {
    let maxCount = -1;
    let nextTied = [];

    tied.forEach(rIdx => {
      const count = regions[rIdx].pawns[race]?.length || 0;
      if (count > maxCount) {
        maxCount = count;
        nextTied = [rIdx];
      } else if (count === maxCount) {
        nextTied.push(rIdx);
      }
    });

    if (maxCount > 0) {
      tied = nextTied;
    }
    if (tied.length === 1) break;
  }

  const finalId = tied[0];
  const hasTarget = priorityRaces.some(race => regions[finalId].pawns[race]?.length > 0);
  return hasTarget ? finalId : null;
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

  const sortedAngerRaces = RACES
    .map(race => ({ race, val: jakub.anger[race] }))
    .filter(a => a.val > 0)
    .sort((a, b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race))
    .map(a => a.race);

  if (sortedAngerRaces.length === 0) return { newState: workState, actionTaken: false, log: "Jakub's anger is gone." };

  // 1. Try to KILL in current region
  for (const race of sortedAngerRaces) {
    const units = currentRegion.pawns[race]?.length || 0;
    if (units > 0) {
      const killCount = Math.min(units, jakub.anger[race]);
      const playerIdx = workState.players.findIndex(p => p.generalOf === race);
      if (playerIdx !== -1) {
        workState.players[playerIdx].points = Math.max(0, workState.players[playerIdx].points - killCount);
      }
      
      jakub.anger[race] -= killCount;
      currentRegion.pawns[race].splice(0, killCount);
      if (currentRegion.pawns[race].length === 0) delete currentRegion.pawns[race];

      return { 
        newState: workState, 
        actionTaken: true, 
        log: `Jakub targets ${race} and kills ${killCount} unit(s) at [${currentRegion.x},${currentRegion.y}]. (-${killCount} pts)`,
        metadata: { race, points: -killCount }
      };
    }
  }

  // 2. Search for BEST region within range
  const candidates = getRegionsInRange(workState.regions, currentRegion.id, jakub.range);
  const bestRIdx = getBestTargetRegion(candidates, sortedAngerRaces, workState.regions);

  if (bestRIdx !== null) {
    const targetRegion = workState.regions[bestRIdx];
    targetRegion.pawns.jakub = currentRegion.pawns.jakub;
    delete currentRegion.pawns.jakub;
    
    return { 
      newState: workState, 
      actionTaken: true, 
      log: `Jakub moves to [${targetRegion.x},${targetRegion.y}] within range ${jakub.range}.` 
    };
  }

  return { newState: workState, actionTaken: false, log: "No targets in range." };
};
