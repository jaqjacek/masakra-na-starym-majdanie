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
export const INITIAL_SETS_PER_PLAYER = 2;
export const SETUP_SETS_PER_PLAYER_PER_ROUND = 3;
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
