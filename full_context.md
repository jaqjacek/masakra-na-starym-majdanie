# Pełny Kontekst Projektu Vue

---
### Plik: src/constants/board.js
```js
export class Board {
  constructor(size = 5) {
    this.size = size;
  }

  generateEmpty() {
    const regions = [];
    for (let i = 0; i < this.size * this.size; i++) {
      regions.push({ 
        id: i, 
        x: i % this.size, 
        y: Math.floor(i / this.size), 
        neighbors: [], 
        pawns: {} 
      });
    }
    
    // Calculate neighbors for each region
    regions.forEach(region => {
      const { x, y } = region;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
            region.neighbors.push(ny * this.size + nx);
          }
        }
      }
    });
    
    return regions;
  }

  static getReachableRegions(regions, startIndex, range) {
    const reachable = new Set();
    const queue = [{ index: startIndex, dist: 0 }];
    const visited = new Set([startIndex]);
    
    while (queue.length > 0) {
      const { index, dist } = queue.shift();
      if (dist > 0) reachable.add(index);
      if (dist < range) {
        regions[index].neighbors.forEach(nIdx => {
          if (!visited.has(nIdx)) { 
            visited.add(nIdx); 
            queue.push({ index: nIdx, dist: dist + 1 }); 
          }
        });
      }
    }
    return Array.from(reachable);
  }

  static getDistance(r1, r2) {
    if (!r1 || !r2) return 999;
    return Math.max(Math.abs(r1.x - r2.x), Math.abs(r1.y - r2.y));
  }
}

```

---
### Plik: src/constants/game.js
```js
import { Board } from './board';

export const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];

const boardService = new Board(5);

export const INITIAL_STATE = {
  regions: boardService.generateEmpty(),
  players: [
    { id: 1, name: '1', points: 30, generalOf: null },
    { id: 2, name: '2', points: 30, generalOf: null },
    { id: 3, name: '3', points: 30, generalOf: null },
    { id: 4, name: '4', points: 30, generalOf: null }
  ],
  sets: { drawPile: [], discardPile: [], heldSets: [], pawns: { bardak: 80, ghost: 30, werewolf: 20, vampire: 10 } },
  phase: 'setup',
  currentRound: 1,
  maxRounds: 8,
  playerOrder: [1, 2, 3, 4],
  currentPlayerIndex: 0,
  passedPlayers: [],
  availableGenerals: [...RACES],
  jakubAngerIncreased: false,
  jakubTurnExecuted: false,
  gameStatus: 'active',
  history: []
};

export const calculateSetPlacementPoints = (race, setContent, targetRegion, jakubRegion, allRegions = []) => {
  const dist = Board.getDistance(targetRegion, jakubRegion);
  const count = setContent[race] || 0;
  if (count <= 0 && race !== 'werewolf') return 0;

  if (race === 'vampire') return Math.max(0, 4 - dist) * count;
  
  if (race === 'werewolf') {
    if (count <= 0) return 0;
    let totalW = count;
    // Count W already in target
    totalW += (targetRegion.pawns?.werewolf?.length || 0);
    // Count W in neighbors
    targetRegion.neighbors.forEach(nIdx => {
      const neighbor = allRegions[nIdx];
      if (neighbor) totalW += (neighbor.pawns?.werewolf?.length || 0);
    });
    
    let pts = Math.ceil(totalW / 3);
    if (dist <= 1) pts += 1; // Jakub is in target or neighbor
    return pts;
  }

  if (race === 'bardak') {
    if (dist <= 1) return 0;
    return count;
  }
  if (race === 'ghost') {
    const distToEdge = Math.min(targetRegion.x, 4 - targetRegion.x, targetRegion.y, 4 - targetRegion.y);
    let perPawn = 2 - distToEdge;
    const jakub = jakubRegion?.pawns.jakub[0];
    if (dist <= (jakub ? jakub.range : 0)) perPawn -= 1;
    return Math.max(0, perPawn) * count;
  }
  return 0;
};

```

---
### Plik: src/constants/pawnTypes.js
```js
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

```

---
### Plik: src/constants/version.js
```js
export const VERSION_INFO = {
  branch: "balancing",
  tag: "v1.4.0",
  hash: "8b71689",
  date: "2026-03-30",
  time: "08:50"
};

```

---
### Plik: src/services/api.js
```js
const API_BASE = '/api/map';

export const fetchMap = async (gameId) => {
  const response = await fetch(`${API_BASE}/${gameId}`);
  if (!response.ok) throw new Error('Failed to fetch map');
  return response.json();
};

export const updateMap = async (gameId, board) => {
  const response = await fetch(`${API_BASE}/${gameId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(board),
  });
  if (!response.ok) throw new Error('Failed to update map');
  return response.json();
};

export const resetMap = async (gameId) => {
  const response = await fetch(`${API_BASE}/${gameId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to reset map');
  return response.json();
};

```

---
### Plik: src/strategies/jakubStrategy.js
```js
export const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];

/**
 * Updates Jakub's anger based on set contents and handles overflow logic.
 * Range = 1 + (number of races with Anger > 10)
 */
export const applySetToJakubAnger = (jakub, setContent) => {
  const newAnger = { ...jakub.anger };

  Object.entries(setContent).forEach(([race, count]) => {
    if (newAnger[race] !== undefined) {
      newAnger[race] += count;
    }
  });

  // Recalculate range based on new anger
  let bonusRange = 0;
  RACES.forEach(race => {
    if (newAnger[race] > 10) bonusRange += 1;
  });

  return { anger: newAnger, range: 1 + bonusRange };
};

const getRegionsInRange = (regions, startIndex, range) => {
  const inRange = new Set();
  const queue = [{ index: startIndex, dist: 0 }];
  const visited = new Set([startIndex]);

  while (queue.length > 0) {
    const { index, dist } = queue.shift();
    if (index !== startIndex) inRange.add(index);
    if (dist < range) {
      regions[index].neighbors.forEach(nIdx => {
        if (!visited.has(nIdx)) {
          visited.add(nIdx);
          queue.push({ index: nIdx, dist: dist + 1 });
        }
      });
    }
  }
  return Array.from(inRange);
};

const getBestTargetRegion = (candidateIndices, priorityRaces, regions) => {
  if (candidateIndices.length === 0) return null;
  let tied = candidateIndices;

  for (const race of priorityRaces) {
    let maxCount = -1;
    let nextTied = [];

    tied.forEach(rIdx => {
      const count = regions[rIdx].pawns[race]?.length || 0;
      if (count > maxCount) {
        maxCount = count;
        nextTied = [rIdx];
      } else if (count === maxCount) {
        nextTied.push(rIdx);
      }
    });

    if (maxCount > 0) {
      tied = nextTied;
    }
    if (tied.length === 1) break;
  }

  const finalId = tied[0];
  const hasTarget = priorityRaces.some(race => regions[finalId].pawns[race]?.length > 0);
  return hasTarget ? finalId : null;
};

/**
 * Executes ONE step of Jakub's turn (either kill or move).
 */
export const executeJakubStep = (gameState) => {
  let workState = JSON.parse(JSON.stringify(gameState));
  
  let jakub = null;
  let currentRegion = null;
  for (const r of workState.regions) {
    if (r.pawns.jakub?.length > 0) {
      jakub = r.pawns.jakub[0];
      currentRegion = r;
      break;
    }
  }

  if (!jakub) return { newState: workState, actionTaken: false, log: "Jakub not found." };

  const sortedAngerRaces = RACES
    .map(race => ({ race, val: jakub.anger[race] }))
    .filter(a => a.val > 0)
    .sort((a, b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race))
    .map(a => a.race);

  if (sortedAngerRaces.length === 0) return { newState: workState, actionTaken: false, log: "Jakub's anger is gone." };

  // 1. Try to KILL in current region
  for (const race of sortedAngerRaces) {
    const units = currentRegion.pawns[race]?.length || 0;
    if (units > 0) {
      const killCount = Math.min(units, jakub.anger[race]);
      const playerIdx = workState.players.findIndex(p => p.generalOf === race);
      if (playerIdx !== -1) {
        workState.players[playerIdx].points = Math.max(0, workState.players[playerIdx].points - killCount);
      }
      
      jakub.anger[race] -= killCount;
      currentRegion.pawns[race].splice(0, killCount);
      if (currentRegion.pawns[race].length === 0) delete currentRegion.pawns[race];

      return { 
        newState: workState, 
        actionTaken: true, 
        log: `Jakub targets ${race} and kills ${killCount} unit(s) at [${currentRegion.x},${currentRegion.y}]. (-${killCount} pts)`,
        metadata: { race, points: -killCount }
      };
    }
  }

  // 2. Search for BEST region within range
  const candidates = getRegionsInRange(workState.regions, currentRegion.id, jakub.range);
  const bestRIdx = getBestTargetRegion(candidates, sortedAngerRaces, workState.regions);

  if (bestRIdx !== null) {
    const targetRegion = workState.regions[bestRIdx];
    targetRegion.pawns.jakub = currentRegion.pawns.jakub;
    delete currentRegion.pawns.jakub;
    
    return { 
      newState: workState, 
      actionTaken: true, 
      log: `Jakub moves to [${targetRegion.x},${targetRegion.y}] within range ${jakub.range}.` 
    };
  }

  return { newState: workState, actionTaken: false, log: "No targets in range." };
};

```
