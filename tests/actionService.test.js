import test from 'node:test';
import assert from 'node:assert';
import { ActionService } from '../shared/actions/actionService.js';
import { Board } from '../src/constants/board.js';

function createMockGameState() {
  const board = new Board(6);
  const regions = board.generateEmpty();
  return {
    gameId: 'test-1',
    players: [
      { id: 1, name: 'Gracz 1', points: 0, generalOf: null },
      { id: 2, name: 'Gracz 2', points: 0, generalOf: null }
    ],
    availableGenerals: ['vampire', 'werewolf', 'ghost', 'bardak'],
    playerOrder: [1, 2],
    currentPlayerIndex: 0,
    passedPlayers: [],
    turnActionExecuted: false,
    history: [],
    regions,
    sets: {
      heldSets: [
        {
          id: 'S1',
          ownerId: 1,
          content: { vampire: 1, werewolf: 1 }
        }
      ],
      drawnSets: [],
      discardPile: [],
      pawnsInPlayLimit: { vampire: 10, werewolf: 10, ghost: 10, bardak: 10 }
    }
  };
}

test('ActionService - handleSelectGeneral', () => {
  const state = createMockGameState();
  ActionService.handleSelectGeneral(state, { playerId: 1, race: 'vampire' });

  assert.strictEqual(state.players[0].generalOf, 'vampire');
  assert.ok(!state.availableGenerals.includes('vampire'));
  assert.strictEqual(state.history.length, 1);
});

test('ActionService - handlePlaceSet', () => {
  const state = createMockGameState();
  state.players[0].generalOf = 'vampire';

  ActionService.handlePlaceSet(state, { playerId: 1, setId: 'S1', toIndex: 0 });

  assert.strictEqual(state.regions[0].pawns.vampire.length, 1);
  assert.strictEqual(state.regions[0].pawns.werewolf.length, 1);
  assert.strictEqual(state.sets.heldSets.length, 0);
  assert.strictEqual(state.sets.discardPile.length, 1);
  assert.strictEqual(state.turnActionExecuted, true);
});

test('ActionService - handleMovePawn', () => {
  const state = createMockGameState();
  // Place a pawn in region 0
  state.regions[0].pawns = { vampire: [{ statuses: ['ENABLED'] }] };

  ActionService.handleMovePawn(state, { playerId: 1, typeId: 'vampire', fromIndex: 0, toIndex: 1, pawnInstanceIndex: 0 });

  assert.strictEqual(state.regions[0].pawns.vampire, undefined);
  assert.strictEqual(state.regions[1].pawns.vampire.length, 1);
});

test('ActionService - handlePassTurn', () => {
  const state = createMockGameState();
  ActionService.handlePassTurn(state, { playerId: 1 });

  assert.ok(state.passedPlayers.includes(1));
  assert.strictEqual(state.currentPlayerIndex, 1);
});
