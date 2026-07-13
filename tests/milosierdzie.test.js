import test from 'node:test';
import assert from 'node:assert';
import { MilosierdzieManager } from '../shared/milosierdzieManager.js';

test('Faza Miłosierdzia - podział parzystej furii', () => {
  const jakub = {
    anger: {
      vampire: 4,
      werewolf: 0,
      ghost: 0,
      bardak: 0
    }
  };
  const players = [
    { id: 1, generalOf: 'vampire', points: 10 },
    { id: 2, generalOf: 'werewolf', points: 10 }
  ];

  const rewards = MilosierdzieManager.applyMercy(jakub, players);

  // Vampire has 4 anger, so 4 / 2 = 2 points added to general, 2 remaining on track.
  assert.strictEqual(players[0].points, 12);
  assert.strictEqual(jakub.anger.vampire, 2);
  assert.strictEqual(rewards.length, 1);
  assert.deepStrictEqual(rewards[0], {
    race: 'vampire',
    points: 2,
    playerName: 'P1',
    playerId: 1
  });
});

test('Faza Miłosierdzia - podział nieparzystej furii (zaokrąglenie w górę)', () => {
  const jakub = {
    anger: {
      vampire: 5,
      werewolf: 0,
      ghost: 0,
      bardak: 0
    }
  };
  const players = [
    { id: 1, generalOf: 'vampire', points: 10 }
  ];

  const rewards = MilosierdzieManager.applyMercy(jakub, players);

  // Vampire has 5 anger, so Math.ceil(5 / 2) = 3 points added, 2 remaining.
  assert.strictEqual(players[0].points, 13);
  assert.strictEqual(jakub.anger.vampire, 2);
  assert.strictEqual(rewards.length, 1);
  assert.strictEqual(rewards[0].points, 3);
});



test('Faza Miłosierdzia - ignorowanie zerowej furii', () => {
  const jakub = {
    anger: {
      vampire: 0,
      werewolf: 0,
      ghost: 0,
      bardak: 0
    }
  };
  const players = [
    { id: 1, generalOf: 'vampire', points: 10 }
  ];

  const rewards = MilosierdzieManager.applyMercy(jakub, players);

  assert.strictEqual(players[0].points, 10);
  assert.strictEqual(jakub.anger.vampire, 0);
  assert.strictEqual(rewards.length, 0);
});
