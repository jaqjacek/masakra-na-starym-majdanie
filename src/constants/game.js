import { Board } from './board';
import { 
  TOTAL_GAME_ROUNDS, 
  INITIAL_PLAYER_POINTS, 
  VAMPIRE_SCORING_RANGE, 
  WEREWOLF_SCORING_DIVISOR, 
  BOARD_SIZE, 
  GHOST_SCORING_BASE 
} from './constants';

export const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];

const boardService = new Board(5);

export const INITIAL_STATE = {
  regions: boardService.generateEmpty(),
  players: [
    { id: 1, name: '1', points: INITIAL_PLAYER_POINTS, generalOf: null },
    { id: 2, name: '2', points: INITIAL_PLAYER_POINTS, generalOf: null },
    { id: 3, name: '3', points: INITIAL_PLAYER_POINTS, generalOf: null },
    { id: 4, name: '4', points: INITIAL_PLAYER_POINTS, generalOf: null }
  ],
  sets: { drawPile: [], discardPile: [], heldSets: [], pawns: { bardak: 80, ghost: 30, werewolf: 20, vampire: 10 } },
  phase: 'setup',
  currentRound: 1,
  maxRounds: TOTAL_GAME_ROUNDS,
  playerOrder: [1, 2, 3, 4],
  currentPlayerIndex: 0,
  passedPlayers: [],
  availableGenerals: [...RACES],
  jakubAngerIncreased: false,
  jakubTurnExecuted: false,
  gameStatus: 'active',
  history: []
};


export const calculateSetPlacementPoints = (race, setContent, targetRegion, jakubRegion, allRegions = []) => {
  const dist = Board.getDistance(targetRegion, jakubRegion);
  const count = setContent[race] || 0;
  if (count <= 0 && race !== 'werewolf') return 0;

  if (race === 'vampire') return Math.max(0, VAMPIRE_SCORING_RANGE - dist) * count;
  
  if (race === 'werewolf') {
    if (count <= 0) return 0;
    let totalW = count;
    // Count W already in target
    totalW += (targetRegion.pawns?.werewolf?.length || 0);
    // Count W in neighbors
    targetRegion.neighbors.forEach(nIdx => {
      const neighbor = allRegions[nIdx];
      if (neighbor) totalW += (neighbor.pawns?.werewolf?.length || 0);
    });
    
    let pts = Math.ceil(totalW / WEREWOLF_SCORING_DIVISOR);
    if (dist <= 1) pts += 1; // Jakub is in target or neighbor
    return pts;
  }

  if (race === 'bardak') {
    if (dist <= 1) return 0;
    return count;
  }
  if (race === 'ghost') {
    const edgeCoord = BOARD_SIZE - 1;
    const distToEdge = Math.min(targetRegion.x, edgeCoord - targetRegion.x, targetRegion.y, edgeCoord - targetRegion.y);
    let perPawn = GHOST_SCORING_BASE - distToEdge;
    const jakub = jakubRegion?.pawns.jakub[0];
    if (dist <= (jakub ? jakub.range : 0)) perPawn -= 1;
    return Math.max(0, perPawn) * count;
  }
  return 0;
};
