import vampireIcon from '../assets/icons/vampire_128x128.png';
import werewolfIcon from '../assets/icons/warewolf_128x128.png';
import ghostIcon from '../assets/icons/ghost_128x128.png';
import bardakIcon from '../assets/icons/bardak_128x128.png';
import jakubIcon from '../assets/icons/jakub_128x128.png';
import { RACES, PAWN_SPEED, JAKUB_BASE_RANGE, emptyAnger } from '../../shared/constants.js';

export const STATUSES = {
  ENABLED: 'ENABLED'
};

export const PAWN_TYPES = [
  {
    id: 'vampire',
    icon: vampireIcon,
    label: 'V',
    name: 'Wampiry',
    color: '#8B0000',
    health: 10,
    speed: PAWN_SPEED.vampire,
    defaultStatuses: [STATUSES.ENABLED]
  },
  {
    id: 'werewolf',
    icon: werewolfIcon,
    label: 'W',
    name: 'Wilkołaki',
    color: '#A0522D',
    health: 15,
    speed: PAWN_SPEED.werewolf,
    defaultStatuses: [STATUSES.ENABLED]
  },
  {
    id: 'ghost',
    icon: ghostIcon,
    label: 'G',
    name: 'Duchy',
    color: '#F0F8FF',
    health: 5,
    speed: PAWN_SPEED.ghost,
    defaultStatuses: [STATUSES.ENABLED]
  },
  {
    id: 'bardak',
    icon: bardakIcon,
    label: 'B',
    name: 'Bardaki',
    color: '#696969',
    health: 20,
    speed: PAWN_SPEED.bardak,
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
    defaultParameters: {
      speed: PAWN_SPEED.jakub,
      range: JAKUB_BASE_RANGE,
      anger: emptyAnger()
    }
  }
];

export const SUMMARY_PAWN_IDS = [...RACES];
