import config from '../../server_config.json' with { type: 'json' };

/**
 * Global game configuration constants.
 */

// Universal SERVER_URL: defaults to '' (relative path) so it uses the active host/port (Docker, localhost, LAN IP).
// Overridable via VITE_SERVER_URL environment variable if needed.
export const SERVER_URL = (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_SERVER_URL)
  ? import.meta.env.VITE_SERVER_URL
  : '';
export const TOTAL_GAME_ROUNDS = 12;
export const INITIAL_HAND_SIZE = 5;
export const MAX_HAND_SIZE = 3;
export const JAKUB_INITIAL_SETS = 2;
export const HISTORY_LIMIT = 100;
export const DEFAULT_AUTOPLAY_SPEED = 100;
export const SURVIVOR_BONUS_MULTIPLIER = 2;
export const INITIAL_PLAYER_POINTS = 20;
export const BOARD_SIZE = 6;
export const JAKUB_ANGER_THRESHOLD = 10;
export const JAKUB_BASE_RANGE = 1;
export const VAMPIRE_SCORING_RANGE = 4;
export const WEREWOLF_SCORING_DIVISOR = 3;
export const GHOST_SCORING_BASE = 2;
export const VAMPIRE_FINAL_SCORING_MULTIPLIER = 2;
export const GHOST_FINAL_SCORING_BONUS = 2;
export const GHOST_FINAL_SCORING_MAX_OTHER_BONUS = 1;
