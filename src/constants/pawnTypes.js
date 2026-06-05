import vampireIcon from '../assets/icons/vampire_128x128.png';
import werewolfIcon from '../assets/icons/warewolf_128x128.png';
import ghostIcon from '../assets/icons/ghost_128x128.png';
import bardakIcon from '../assets/icons/bardak_128x128.png';
import jakubIcon from '../assets/icons/jakub_128x128.png';

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
    name: 'Wampiry', 
    color: '#8B0000',
    health: 10,
    speed: 999,
    defaultStatuses: [STATUSES.ENABLED]
  },
  { 
    id: 'werewolf', 
    icon: werewolfIcon, 
    label: 'W', 
    name: 'Wilkołaki', 
    color: '#A0522D',
    health: 15,
    speed: 2,
    defaultStatuses: [STATUSES.ENABLED]
  },
  { 
    id: 'ghost', 
    icon: ghostIcon, 
    label: 'G', 
    name: 'Duchy', 
    color: '#F0F8FF',
    health: 5,
    speed: 1,
    defaultStatuses: [STATUSES.ENABLED]
  },
  { 
    id: 'bardak', 
    icon: bardakIcon, 
    label: 'B', 
    name: 'Bardaki', 
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
      range: 1,
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
