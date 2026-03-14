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
 * Returns { newState, actionTaken: boolean, log: string }
 */
export const executeJakubStep = (gameState) => {
  let workState = JSON.parse(JSON.stringify(gameState));
  let log = "";
  let actionTaken = false;

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

  // 2. Try to KILL in current region
  let killedSomething = false;
  RACES.forEach(race => {
    const killedCount = currentRegion.pawns[race]?.length || 0;
    if (killedCount > 0) {
      killedSomething = true;
      actionTaken = true;
      // Deduct points from General
      const playerIdx = workState.players.findIndex(p => p.generalOf === race);
      if (playerIdx !== -1) {
        workState.players[playerIdx].points = Math.max(0, workState.players[playerIdx].points - killedCount);
      }
      // Deduct anger
      jakub.anger[race] = Math.max(0, jakub.anger[race] - killedCount);
      // Remove pawns
      currentRegion.pawns[race] = [];
      log = `Jakub killed ${killedCount} ${race}(s) at [${currentRegion.x},${currentRegion.y}].`;
    }
  });

  if (killedSomething) return { newState: workState, actionTaken, log };

  // 3. Try to MOVE
  const angerLevels = RACES
    .map(race => ({ race, value: jakub.anger[race] }))
    .filter(a => a.value > 0)
    .sort((a, b) => b.value - a.value || RACES.indexOf(a.race) - RACES.indexOf(b.race));

  if (angerLevels.length === 0) {
    return { newState: workState, actionTaken: false, log: "Jakub's anger is gone." };
  }

  for (const target of angerLevels) {
    const targetRace = target.race;
    const validNeighborIdx = currentRegion.neighbors.find(nIdx => {
      const neighbor = workState.regions[nIdx];
      return neighbor.pawns[targetRace]?.length > 0;
    });

    if (validNeighborIdx !== undefined) {
      const targetRegion = workState.regions[validNeighborIdx];
      targetRegion.pawns.jakub = currentRegion.pawns.jakub;
      delete currentRegion.pawns.jakub;
      
      return { 
        newState: workState, 
        actionTaken: true, 
        log: `Jakub moves to [${targetRegion.x},${targetRegion.y}] hunting ${targetRace}.` 
      };
    }
  }

  return { newState: workState, actionTaken: false, log: "No targets in range." };
};
