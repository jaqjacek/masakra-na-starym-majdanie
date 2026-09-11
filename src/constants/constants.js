export {
  TOTAL_GAME_ROUNDS,
  SETUP_SETS_PER_PLAYER_PER_ROUND,
  JAKUB_SETS_PER_ROUND,
  JAKUB_BASE_RANGE,
  computeJakubRange
} from '../../shared/constants.js';

export const SERVER_URL = (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_SERVER_URL)
  ? import.meta.env.VITE_SERVER_URL
  : '';

export const HISTORY_LIMIT = 100;
export const DEFAULT_AUTOPLAY_SPEED = 100;
