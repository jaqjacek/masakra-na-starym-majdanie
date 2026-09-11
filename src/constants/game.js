import { Board } from './board.js';
import {
  RACES,
  BOARD_SIZE,
  INITIAL_PLAYER_POINTS,
  TOTAL_GAME_ROUNDS,
  INITIAL_PAWN_POOL,
  PAWNS_IN_PLAY_LIMIT,
  PLAYER_IDS
} from '../../shared/constants.js';

export { RACES };

const boardService = new Board(BOARD_SIZE);

export const INITIAL_STATE = {
  regions: boardService.generateEmpty(),
  players: PLAYER_IDS.map((id) => ({
    id,
    name: String(id),
    points: INITIAL_PLAYER_POINTS,
    generalOf: null
  })),
  sets: {
    drawPile: [],
    discardPile: [],
    heldSets: [],
    pawns: { ...INITIAL_PAWN_POOL },
    pawnsInPlayLimit: { ...PAWNS_IN_PLAY_LIMIT }
  },
  phase: 'setup',
  currentRound: 1,
  totalRounds: TOTAL_GAME_ROUNDS,
  playerOrder: [...PLAYER_IDS],
  currentPlayerIndex: 0,
  passedPlayers: [],
  availableGenerals: [...RACES],
  magnetismCount: 0,
  gameStatus: 'active',
  manualPlayers: [],
  history: []
};
