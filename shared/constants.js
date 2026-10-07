export const GAME_TITLE = 'MASAKRA na Starym Majdanie';

export const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];

export const RACE_TO_ABBR = {
  vampire: 'V',
  werewolf: 'W',
  ghost: 'G',
  bardak: 'B'
};

export const RACE_MAP = {
  V: 'vampire',
  W: 'werewolf',
  G: 'ghost',
  B: 'bardak'
};

export const RACE_MAP_PL = {
  vampire: 'Wampiry',
  werewolf: 'Wilkołaki',
  ghost: 'Duchy',
  bardak: 'Bardaki'
};

export const PLAYER_IDS = [1, 2, 3, 4];

export const BOARD_SIZE = 6;
export const TOTAL_GAME_ROUNDS = 12;
export const INITIAL_PLAYER_POINTS = 20;
export const INITIAL_SETS_PER_PLAYER = 5;
/** Sets added to each player's hand at the start of every round after the first. */
export const SETUP_SETS_PER_PLAYER_PER_ROUND = 3;
/** Max sets a player may keep when passing; excess is tipped to Jakub with no points. */
export const MAX_SETS_KEPT_ON_PASS = 3;
export const JAKUB_SETS_PER_ROUND = 2;

export const JAKUB_ANGER_THRESHOLD = 10;
export const JAKUB_BASE_RANGE = 1;
export const JAKUB_MAX_RANGE = 5;
export const JAKUB_MELEE_DISTANCE = 1;

export const PAWN_SPEED = {
  vampire: 999,
  werewolf: 2,
  ghost: 1,
  bardak: 1,
  jakub: 1
};

export const MAX_POWER = 6;
export const MAX_UNITS_PER_SET = 4;
export const MIN_SET_POWER = 3;
export const MAX_RACES_PER_SET = 3;
export const MAX_BARDAKS_PER_REGULAR_SET = 3;
export const MAX_GENERATED_SETS = 50;

export const PAWN_CONSTRAINTS = {
  vampire: 1,
  werewolf: 1,
  ghost: 2,
  bardak: MAX_BARDAKS_PER_REGULAR_SET
};

export const INITIAL_PAWN_POOL = {
  bardak: 80,
  ghost: 30,
  werewolf: 20,
  vampire: 10
};

export const PAWNS_IN_PLAY_LIMIT = {
  vampire: 10,
  werewolf: 20,
  ghost: 30,
  bardak: 80
};

export const DEFAULT_POWER_CONFIG = {
  vampire: 3,
  werewolf: 2,
  ghost: 1,
  bardak: 1
};

export const VAMPIRE_SCORING_RANGE = 4;
export const WEREWOLF_SCORING_DIVISOR = 3;
export const GHOST_SCORING_BASE = 2;
export const VAMPIRE_FINAL_SCORING_MULTIPLIER = 2;
export const GHOST_FINAL_SCORING_BONUS = 2;
export const GHOST_FINAL_SCORING_MAX_OTHER_BONUS = 1;
export const BARDAK_FINAL_MAJORITY_BONUS = 1;
export const DEFAULT_JAKUB_DISTANCE = 3;

export const MERCY_DIVISOR = 2;

/** Points for voluntarily giving a set to Jakub (kablowanie). */
export const KABLOWANIE_POINTS = 1;

/** Max entries kept in `state.history` by server-side writers. */
export const MAX_HISTORY_ENTRIES = 100;
/** History cap used by `ActionService.addLog` (shared client/server actions). */
export const MAX_ACTION_HISTORY_ENTRIES = 50;

// Player AI heuristic weights (see docs/PLAYER_AI.md). Tuning these changes AI play.
export const AI_KABLOWANIE_OWN_PAWN_COST = 1.25;
export const AI_KABLOWANIE_RANGE_BUMP_COST = 2;
export const AI_KABLOWANIE_OPPONENT_PAWN_BONUS = 0.1;
export const AI_KABLOWANIE_OPPONENT_BONUS_CAP = 0.4;
export const AI_THREAT_IN_RANGE_MULTIPLIER = 1.5;
export const AI_THREAT_NEAR_RANGE_MULTIPLIER = 0.5;

export const AI_GENERAL_HAND_WEIGHT = {
  vampire: 2.5,
  werewolf: 1.5,
  ghost: 2.0,
  bardak: 1.0
};
export const AI_GENERAL_BOARD_WEIGHT = {
  vampire: 1.0,
  werewolf: 1.0,
  ghost: 0.5,
  bardak: 0.5
};
export const AI_GENERAL_ANGER_PENALTY = 2.0;
export const AI_GENERAL_MAIN_TARGET_PENALTY = 5.0;

// Server player AI loop.
export const MAX_PLAYER_AI_STEPS = 200;
/** Human viewers see each AI move held for this many autoplay ticks. */
export const PLAYER_AI_REVEAL_TICKS = 5;
export const DEFAULT_AUTOPLAY_SPEED_MS = 100;
export const MIN_AUTOPLAY_SPEED_MS = 50;
export const MAX_AUTOPLAY_SPEED_MS = 1500;
export const AUTOPLAY_SPEED_STEP_MS = 50;

export const DEFAULT_PLAYERS = PLAYER_IDS.map((id) => ({
  id,
  name: String(id),
  points: INITIAL_PLAYER_POINTS,
  generalOf: null
}));

export const emptyAnger = () => Object.fromEntries(RACES.map((race) => [race, 0]));

export const DEFAULT_PAWN_CONFIGS = {
  vampire: { defaultStatuses: ['ENABLED'] },
  werewolf: { defaultStatuses: ['ENABLED'] },
  ghost: { defaultStatuses: ['ENABLED'] },
  bardak: { defaultStatuses: ['ENABLED'] },
  jakub: {
    defaultStatuses: ['ENABLED'],
    defaultParameters: {
      speed: PAWN_SPEED.jakub,
      range: JAKUB_BASE_RANGE,
      anger: emptyAnger()
    }
  }
};

export const DEFAULT_GAME_CONFIG = {
  gameTitle: GAME_TITLE,
  startPointsAmmount: INITIAL_PLAYER_POINTS,
  initialSetsPerPlayer: INITIAL_SETS_PER_PLAYER,
  setupSetsPerPlayerPerRound: SETUP_SETS_PER_PLAYER_PER_ROUND,
  jakubSetsPerRound: JAKUB_SETS_PER_ROUND,
  totalRounds: TOTAL_GAME_ROUNDS,
  maxPower: MAX_POWER,
  maxUnitsPerSet: MAX_UNITS_PER_SET
};

export function computeJakubRange(anger, {
  threshold = JAKUB_ANGER_THRESHOLD,
  baseRange = JAKUB_BASE_RANGE,
  maxRange = JAKUB_MAX_RANGE
} = {}) {
  let extraRange = 0;
  Object.values(anger || {}).forEach((val) => {
    if (val >= threshold) extraRange += 1;
  });
  return Math.min(maxRange, baseRange + extraRange);
}

export function regionXY(region) {
  if (!region) return { x: 0, y: 0 };
  const x = region.x !== undefined ? region.x : (region.id !== undefined ? region.id % BOARD_SIZE : 0);
  const y = region.y !== undefined ? region.y : (region.id !== undefined ? Math.floor(region.id / BOARD_SIZE) : 0);
  return { x, y };
}
