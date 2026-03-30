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
  playerOrder: [1, 2, 3, 4],
  currentPlayerIndex: 0,
  passedPlayers: [],
  availableGenerals: [...RACES],
  jakubAngerIncreased: false,
  jakubTurnExecuted: false,
  gameStatus: 'active',
  history: []
};

export const calculateSetPlacementPoints = (race, setContent, targetRegion, jakubRegion) => {
  const dist = Board.getDistance(targetRegion, jakubRegion);
  const ownPawnsInSet = setContent[race] || 0;
  if (race === 'vampire') return ownPawnsInSet + (3 - dist);
  if (race === 'werewolf') return (dist <= 2) ? (ownPawnsInSet + 1) : 0;
  if (race === 'bardak') return Object.values(setContent).reduce((a, b) => a + b, 0);
  if (race === 'ghost') {
    const isBorder = targetRegion.x === 0 || targetRegion.x === 4 || targetRegion.y === 0 || targetRegion.y === 4;
    if (isBorder) {
      let pts = ownPawnsInSet;
      const jakub = jakubRegion?.pawns.jakub[0];
      if (dist <= (jakub ? jakub.range : 0)) pts -= 1;
      return pts;
    }
    return ownPawnsInSet + (dist > 2 ? 1 : -1);
  }
  return 0;
};
