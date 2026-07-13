import test from 'node:test';
import assert from 'node:assert';
import { executeJakubStep } from '../src/strategies/jakubStrategy.js';

test('Świadek Jakuba - naliczanie punktów przy ruchu Jakuba', () => {
  const gameState = {
    currentRound: 1,
    phase: 'jakub',
    players: [
      { id: 1, name: 'Gracz 1', generalOf: 'vampire', points: 10 }
    ],
    regions: [
      { id: 0, x: 0, y: 0, pawns: { jakub: [{ range: 1, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }], vampire: [{}, {}] }, neighbors: [1] },
      { id: 1, x: 1, y: 0, pawns: { werewolf: [{}] }, neighbors: [0] }
    ]
  };

  const jakub = gameState.regions[0].pawns.jakub[0];
  jakub.anger.werewolf = 5;

  const result = executeJakubStep(gameState);
  const state = result.newState;

  assert.strictEqual(result.actionTaken, true);
  // Jakub moved to region 1
  assert.strictEqual(state.regions[1].pawns.jakub?.length, 1);
  assert.strictEqual(state.regions[0].pawns.jakub, undefined);

  // Player 1 (vampire general) should get 2 points for the 2 vampires in region 0
  assert.strictEqual(state.players[0].points, 12);
  assert.strictEqual(result.metadata?.swiadekPointsAwarded?.length, 1);
  assert.strictEqual(result.metadata.swiadekPointsAwarded[0].points, 2);
});

test('Świadek Jakuba - naliczanie punktów na koniec łowów (brak celów w zasięgu)', () => {
  const gameState = {
    currentRound: 1,
    phase: 'jakub',
    players: [
      { id: 1, name: 'Gracz 1', generalOf: 'vampire', points: 10 }
    ],
    regions: [
      { id: 0, x: 0, y: 0, pawns: { jakub: [{ range: 1, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }], vampire: [{}] }, neighbors: [] }
    ]
  };

  const result = executeJakubStep(gameState);
  const state = result.newState;

  assert.strictEqual(result.actionTaken, false); // Hunt ends
  assert.strictEqual(state.players[0].points, 11); // 1 point for the vampire in region 0
  assert.strictEqual(result.metadata?.swiadekPointsAwarded?.length, 1);
});

test('Świadek Jakuba - brak punktów dla nacji z furią > 0', () => {
  const gameState = {
    currentRound: 1,
    phase: 'jakub',
    players: [
      { id: 1, name: 'Gracz 1', generalOf: 'vampire', points: 10 },
      { id: 2, name: 'Gracz 2', generalOf: 'ghost', points: 10 }
    ],
    regions: [
      { 
        id: 0, 
        x: 0, 
        y: 0, 
        pawns: { 
          jakub: [{ range: 1, anger: { vampire: 2, werewolf: 0, ghost: 0, bardak: 0 } }], 
          vampire: [{}], // anger 2 > 0 (will get killed, no witness points)
          ghost: [{}]    // anger 0 (should get witness points if Jakub leaves)
        }, 
        neighbors: [1] 
      },
      { id: 1, x: 1, y: 0, pawns: { werewolf: [{}] }, neighbors: [0] }
    ]
  };

  // We set anger on werewolf to 5 so Jakub will move to region 1
  const jakub = gameState.regions[0].pawns.jakub[0];
  jakub.anger.werewolf = 5;

  // Step 1: Cleansing. Since there is a vampire (anger 2) in region 0, Jakub will kill it first.
  let result = executeJakubStep(gameState);
  let state = result.newState;
  assert.strictEqual(result.actionTaken, true);
  // Vampire is killed, no witness points yet (still in region 0)
  assert.strictEqual(state.players[0].points, 9); // vampire general loses 1 point for killed pawn
  assert.strictEqual(state.players[1].points, 10);

  // Step 2: Now no targets left in region 0. Jakub moves to region 1.
  // Before leaving, he awards witness points for ghost (anger 0) but NOT for vampire (anger 1 remaining).
  result = executeJakubStep(state);
  state = result.newState;
  assert.strictEqual(result.actionTaken, true);
  assert.strictEqual(state.regions[1].pawns.jakub?.length, 1);

  // Ghost general (Player 2) gets 1 witness point. Vampire general (Player 1) gets 0.
  assert.strictEqual(state.players[0].points, 9);
  assert.strictEqual(state.players[1].points, 11);
});
