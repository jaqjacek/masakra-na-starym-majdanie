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

