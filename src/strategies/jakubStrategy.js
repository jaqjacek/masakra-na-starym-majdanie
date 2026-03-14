export const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];

const getTime = () => new Date().toLocaleTimeString();

/**
 * Increases Jakub's anger counters based on specific race ranges.
 */
export const randomizeJakubAnger = (jakub) => {
  const increments = {
    vampire: Math.floor(Math.random() * 3) + 1, // 1-3
    werewolf: Math.floor(Math.random() * 2) + 2, // 2-3
    ghost: Math.floor(Math.random() * 3) + 2, // 2-4
    bardak: Math.floor(Math.random() * 3) + 3  // 3-5
  };
  
  const newAnger = { ...jakub.anger };
  RACES.forEach(race => {
    newAnger[race] = Math.min(9, (newAnger[race] || 0) + increments[race]);
  });
  return newAnger;
};

/**
 * Executes ONE step of Jakub's turn (either kill or move).
 * Logic: Target highest anger race first. Kill if in region, move if nearby.
 */
export const executeJakubStep = (gameState) => {
  let workState = JSON.parse(JSON.stringify(gameState));
  
  // 1. Find Jakub
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

  // Get races sorted by current anger level, then by priority V > W > G > B
  const sortedAnger = RACES
    .map(race => ({ race, val: jakub.anger[race] }))
    .filter(a => a.val > 0)
    .sort((a, b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race));

  if (sortedAnger.length === 0) return { newState: workState, actionTaken: false, log: "Jakub's anger is gone." };

  // Iterate through races Jakub is angry at
  for (const entry of sortedAnger) {
    const targetRace = entry.race;
    const unitsInRegion = currentRegion.pawns[targetRace]?.length || 0;

    // A. Kill in current region
    if (unitsInRegion > 0) {
      const killCount = Math.min(unitsInRegion, entry.val);
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
        log: `Jakub targets ${targetRace} and kills ${killCount} unit(s) at [${currentRegion.x},${currentRegion.y}].` 
      };
    }

    // B. Search neighbors for the SAME target race
    const targetNeighborIdx = currentRegion.neighbors.find(nIdx => {
      return workState.regions[nIdx].pawns[targetRace]?.length > 0;
    });

    if (targetNeighborIdx !== undefined) {
      const targetRegion = workState.regions[targetNeighborIdx];
      targetRegion.pawns.jakub = currentRegion.pawns.jakub;
      delete currentRegion.pawns.jakub;
      
      return { 
        newState: workState, 
        actionTaken: true, 
        log: `Jakub smells ${targetRace} nearby and moves to [${targetRegion.x},${targetRegion.y}].` 
      };
    }
    
    // If no units here and no units in neighbors for THIS race, continue to NEXT angriest race
  }

  return { newState: workState, actionTaken: false, log: "No targets in range." };
};
