import config from '../../server_config.json';

/**
 * Global game configuration constants.
 */

// Use server_config.json for dev, but in production we can default to relative paths
// if config.SERVER_URL is not set or matches dev default.
export const SERVER_URL = (config.SERVER_URL && config.SERVER_URL !== 'http://localhost:3001') 
  ? config.SERVER_URL 
  : (import.meta.env.PROD ? '' : 'http://localhost:3001');
export const TOTAL_GAME_ROUNDS = 10;
export const INITIAL_HAND_SIZE = 5;
export const MAX_HAND_SIZE = 3;
export const JAKUB_INITIAL_SETS = 2;
export const HISTORY_LIMIT = 100;
export const DEFAULT_AUTOPLAY_SPEED = 200;
export const SURVIVOR_BONUS_MULTIPLIER = 2;
export const INITIAL_PLAYER_POINTS = 10;
export const BOARD_SIZE = 6;
export const JAKUB_ANGER_THRESHOLD = 10;
export const JAKUB_BASE_RANGE = 1;
export const VAMPIRE_SCORING_RANGE = 4;
export const WEREWOLF_SCORING_DIVISOR = 3;
export const GHOST_SCORING_BASE = 2;
export const VAMPIRE_FINAL_SCORING_MULTIPLIER = 2;
export const GHOST_FINAL_SCORING_BONUS = 2;
export const GHOST_FINAL_SCORING_MAX_OTHER_BONUS = 1;
