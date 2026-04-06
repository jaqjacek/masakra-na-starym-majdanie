import vampireIcon from '../assets/icons/vampire.svg';
import werewolfIcon from '../assets/icons/werewolf.svg';
import ghostIcon from '../assets/icons/ghost.svg';
import bardakIcon from '../assets/icons/bardak.svg';
import jakubIcon from '../assets/icons/jakub.svg';

export const STATUSES = {
  DISABLED: 'DISABLED',
  ENABLED: 'ENABLED',
  INVINCIBLE: 'INVINCIBLE',
  CURSED: 'CURSED',
  BLEED: 'BLEED',
  SLOW: 'SLOW',
  BLESSED: 'BLESSED',
  FAST: 'FAST'
};

export const PAWN_TYPES = [
  { 
    id: 'vampire', 
    icon: vampireIcon, 
    label: 'V', 
    name: 'Vampire', 
    color: '#8B0000',
    health: 10,
    speed: 999,
    defaultStatuses: [STATUSES.ENABLED]
  },
  { 
    id: 'werewolf', 
    icon: werewolfIcon, 
    label: 'W', 
    name: 'Werewolf', 
    color: '#A0522D',
    health: 15,
    speed: 2,
    defaultStatuses: [STATUSES.ENABLED]
  },
  { 
    id: 'ghost', 
    icon: ghostIcon, 
    label: 'G', 
    name: 'Ghost', 
    color: '#F0F8FF',
    health: 5,
    speed: 1,
    defaultStatuses: [STATUSES.ENABLED]
  },
  { 
    id: 'bardak', 
    icon: bardakIcon, 
    label: 'B', 
    name: 'Bardak', 
    color: '#696969',
    health: 20,
    speed: 1,
    defaultStatuses: [STATUSES.ENABLED]
  },
  { 
    id: 'jakub', 
    icon: jakubIcon, 
    label: 'J', 
    name: 'Jakub', 
    color: '#f1c40f',
    health: 100,
    isUnique: true,
    defaultStatuses: [STATUSES.ENABLED],
    // New defaults for special Jakub logic
    defaultParameters: {
      speed: 1,
      range: 0,
      anger: {
        vampire: 0,
        werewolf: 0,
        ghost: 0,
        bardak: 0
      }
    }
  }
];

export const SUMMARY_PAWN_IDS = ['vampire', 'werewolf', 'ghost', 'bardak'];
