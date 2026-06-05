export const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];

export const DEFAULT_PLAYERS = [
  { id: 1, name: '1', points: 20, generalOf: null },
  { id: 2, name: '2', points: 20, generalOf: null },
  { id: 3, name: '3', points: 20, generalOf: null },
  { id: 4, name: '4', points: 20, generalOf: null }
];

export const PAWN_CONSTRAINTS = {
  vampire: 1,
  werewolf: 1,
  ghost: 2,
  bardak: 99
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

export const JAKUB_ANGER_THRESHOLD = 10;
export const JAKUB_BASE_RANGE = 1;

