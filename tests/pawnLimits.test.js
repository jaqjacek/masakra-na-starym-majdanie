import test from 'node:test';
import assert from 'node:assert';
import { SharedPlacementManager } from '../shared/sharedPlacementManager.js';

test('Limity pionków - uniemożliwienie wystawienia zestawu przekraczającego limit planszy', () => {
  const regions = [
    { id: 0, pawns: { vampire: [{}, {}, {}, {}] }, neighbors: [1], jakubDistance: 3 }, // 4 wampiry na planszy
    { id: 1, pawns: {}, neighbors: [0], jakubDistance: 3 }
  ];

  // Limit planszy (playLimits) to 5 wampirów. Pula globalna to 10.
  const globalPawnPool = { vampire: 10, werewolf: 10, ghost: 10, bardak: 10 };
  const playLimits = { vampire: 5, werewolf: 10, ghost: 10, bardak: 10 };

  // Gracz ma 2 wampiry w zestawie. Przekroczyłoby to limit planszy (4 + 2 = 6 > 5)
  const heldSets = [
    { id: 'set-over-limit', ownerId: 1, content: { vampire: 2 } }
  ];

  const best = SharedPlacementManager.findBestPlacement(
    regions,
    heldSets,
    1,          // playerId
    'vampire',  // generalOf
    globalPawnPool,
    playLimits
  );

  // Zestaw nie powinien być możliwy do wystawienia (brak dozwolonych placementów)
  assert.strictEqual(best, null);
});

test('Limity pionków - dozwolone wystawienie mieszczące się w limicie', () => {
  const regions = [
    { id: 0, pawns: { vampire: [{}, {}, {}, {}] }, neighbors: [1], jakubDistance: 3 }, // 4 wampiry na planszy
    { id: 1, pawns: {}, neighbors: [0], jakubDistance: 3 }
  ];

  const globalPawnPool = { vampire: 10, werewolf: 10, ghost: 10, bardak: 10 };
  const playLimits = { vampire: 5, werewolf: 10, ghost: 10, bardak: 10 };

  // Gracz ma dokładnie 1 wampira w zestawie. Mieści się to w limicie (4 + 1 = 5 <= 5)
  const heldSets = [
    { id: 'set-valid', ownerId: 1, content: { vampire: 1 } }
  ];

  const best = SharedPlacementManager.findBestPlacement(
    regions,
    heldSets,
    1,
    'vampire',
    globalPawnPool,
    playLimits
  );

  // Zestaw powinien być możliwy do wystawienia
  assert.ok(best !== null);
  assert.strictEqual(best.set.id, 'set-valid');
});

test('Limity pionków - wyczerpanie puli globalnej', () => {
  const regions = [
    { id: 0, pawns: { vampire: [{}, {}] }, neighbors: [1], jakubDistance: 3 }, // 2 wampiry na planszy
    { id: 1, pawns: {}, neighbors: [0], jakubDistance: 3 }
  ];

  // Pula globalna wynosi 2 (czyli brak wolnych pionków w pudełku)
  const globalPawnPool = { vampire: 2, werewolf: 10, ghost: 10, bardak: 10 };
  const playLimits = { vampire: 10, werewolf: 10, ghost: 10, bardak: 10 };

  const heldSets = [
    { id: 'set-no-pawns-left', ownerId: 1, content: { vampire: 1 } }
  ];

  const best = SharedPlacementManager.findBestPlacement(
    regions,
    heldSets,
    1,
    'vampire',
    globalPawnPool,
    playLimits
  );

  // Pula globalna wyczerpana (2/2 w grze), więc wystawienie kolejnego wampira jest zablokowane
  assert.strictEqual(best, null);
});
