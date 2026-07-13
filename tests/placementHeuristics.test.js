import test from 'node:test';
import assert from 'node:assert';
import { SharedPlacementManager } from '../shared/sharedPlacementManager.js';

test('Heurystyka Wystawiania - unikanie pól w zasięgu Jakuba przy dużej furii', () => {
  const regions = [
    { id: 0, x: 0, y: 0, pawns: { jakub: [{ range: 1, anger: { vampire: 10 } }] }, neighbors: [1, 2] },
    { id: 1, x: 1, y: 0, pawns: {}, neighbors: [0], jakubDistance: 1 }, // in range
    { id: 2, x: 2, y: 0, pawns: {}, neighbors: [0], jakubDistance: 2 }  // safe distance
  ];

  const heldSets = [
    { id: 'set1', ownerId: 1, content: { vampire: 2 } }
  ];

  const globalPool = { vampire: 10 };
  const playLimits = { vampire: 10 };

  // vampire general
  const best = SharedPlacementManager.findBestPlacement(regions, heldSets, 1, 'vampire', globalPool, playLimits, 1);

  // Region 2 is at distance 2 (safe), whereas Region 1 is at distance 1 (threatened by Jakub who has 10 vampire anger).
  // The strategic scorer should prefer Region 2 to avoid the threat.
  assert.strictEqual(best.region.id, 2);
});

test('Heurystyka Wystawiania - preferowanie celów końcowych (Wampir)', () => {
  const regions = [
    { id: 1, x: 1, y: 0, pawns: { vampire: [{}] }, neighbors: [], jakubDistance: 3 }, // vampire already present
    { id: 2, x: 2, y: 0, pawns: {}, neighbors: [], jakubDistance: 3 }             // empty region
  ];

  const heldSets = [
    { id: 'set1', ownerId: 1, content: { vampire: 1 } }
  ];

  const globalPool = { vampire: 10 };
  const playLimits = { vampire: 10 };

  const best = SharedPlacementManager.findBestPlacement(regions, heldSets, 1, 'vampire', globalPool, playLimits, 1);

  // Vampires get a bonus for spreading to empty/new regions. Region 2 is empty, so it should be preferred over Region 1.
  assert.strictEqual(best.region.id, 2);
});
