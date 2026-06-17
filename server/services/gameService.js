import fs from 'fs';
import path from 'path';
import { 
  RACES, 
  DEFAULT_PLAYERS, 
  INITIAL_PAWN_POOL, 
  DEFAULT_POWER_CONFIG 
} from '../constants.js';
import { 
  createEmptyRegions 
} from '../boardManager.js';
import { 
  loadSetFile, 
  generateSetData 
} from '../setManager.js';
import { 
  getGlobalConfig, 
  getGameConfig,
  CONFIGS_DIR,
  saveFullState,
  backupRound
} from '../gameLogic.js';
import { GameEventPhaseManager } from '../events/gameEventPhaseManager.js';

export function initializeGame(gameId, requestedSet, io) {
  const regions = createEmptyRegions(); 
  const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS)); 
  const globalConfig = getGlobalConfig(); 
  const gameConfig = getGameConfig();

  console.log(`[Game ${gameId}] Initializing with config:`, JSON.stringify(gameConfig, null, 2));
  
  // Set starting points
  players.forEach(p => p.points = gameConfig.startPointsAmmount);
  
  let set = requestedSet; 
  if (!set && fs.existsSync(path.join(CONFIGS_DIR, 'set_default.json'))) set = 'set_default'; 
  if (!set) set = globalConfig.defaultSetName;
  
  let setsData = (set ? loadSetFile(set) : null) || generateSetData(INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, gameConfig.maxPower, { maxUnitsPerSet: gameConfig.maxUnitsPerSet });
  if (setsData.items && !setsData.drawPile) { setsData.drawPile = setsData.items; delete setsData.items; }
  if (!setsData.discardPile) setsData.discardPile = []; if (!setsData.heldSets) setsData.heldSets = [];
  
  const setName = setsData.setName || 'generated'; 
  const playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
  
  players.forEach(p => {
    for (let i = 0; i < gameConfig.initialSetsPerPlayer; i++) { 
      if (setsData.drawPile.length === 0) break; 
      const s = setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0]; 
      s.ownerId = p.id; setsData.heldSets.push(s); 
    }
  });
  
  const finalState = { 
    regions, players, sets: setsData, phase: 'setup', currentRound: 1, 
    totalRounds: gameConfig.totalRounds,
    currentPlayerIndex: 0, playerOrder, passedPlayers: [], availableGenerals: [...RACES], 
    setName, history: [{
      time: new Date().toLocaleTimeString(), 
      text: `Game started with config: ${JSON.stringify(gameConfig)}`
    }], 
    gameStatus: 'active', jakubAngerIncreased: false, jakubTurnExecuted: false 
  };

  // Initialize events
  const eventManager = new GameEventPhaseManager(finalState);
  eventManager.ensureEventState();
  console.log(`[Game ${gameId}] Events initialized:`, !!finalState.events, finalState.events?.pool?.length);
  
  saveFullState(gameId, finalState); 
  backupRound(gameId, 1);
  if (io) io.to(`game:${gameId}`).emit('boardUpdate', finalState); 
  return finalState;
}
