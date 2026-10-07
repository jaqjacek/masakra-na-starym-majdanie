export {
  TOTAL_GAME_ROUNDS,
  SETUP_SETS_PER_PLAYER_PER_ROUND,
  JAKUB_SETS_PER_ROUND,
  JAKUB_BASE_RANGE,
  MAX_HISTORY_ENTRIES as HISTORY_LIMIT,
  DEFAULT_AUTOPLAY_SPEED_MS as DEFAULT_AUTOPLAY_SPEED,
  MIN_AUTOPLAY_SPEED_MS,
  MAX_AUTOPLAY_SPEED_MS,
  AUTOPLAY_SPEED_STEP_MS,
  computeJakubRange
} from '../../shared/constants.js';

export const SERVER_URL = (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_SERVER_URL)
  ? import.meta.env.VITE_SERVER_URL
  : '';
