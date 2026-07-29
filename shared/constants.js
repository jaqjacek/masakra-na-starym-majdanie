export const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];

export const RACE_TO_ABBR = {
  vampire: 'V',
  werewolf: 'W',
  ghost: 'G',
  bardak: 'B'
};

export const DEFAULT_PAWN_CONFIGS = {
  vampire: { defaultStatuses: ['ENABLED'] },
  werewolf: { defaultStatuses: ['ENABLED'] },
  ghost: { defaultStatuses: ['ENABLED'] },
  bardak: { defaultStatuses: ['ENABLED'] },
  jakub: {
    defaultStatuses: ['ENABLED'],
    defaultParameters: {
      speed: 1,
      range: 1,
      anger: {
        vampire: 0,
        werewolf: 0,
        ghost: 0,
        bardak: 0
      }
    }
  }
};
