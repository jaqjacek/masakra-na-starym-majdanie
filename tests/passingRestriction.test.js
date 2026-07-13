import test from 'node:test';
import assert from 'node:assert';
import { SharedPlacementManager } from '../shared/sharedPlacementManager.js';

test('Restrykcja pasowania - wataha/anger majority check (zablokowane pasowanie)', () => {
  const set = {
    content: { vampire: 2 } // Only 1 race
  };

  const regions = [
    { pawns: { vampire: [] } } // 0 vampires on board
  ];

  const jakub = {
    anger: { vampire: 5 } // anger 5 > 0 on board (violates)
  };

  // 1 of 1 races violates, which is 100% (majority). Should be blocked.
  const canPass = SharedPlacementManager.isSetAllowedToPass(set, regions, jakub);
  assert.strictEqual(canPass, false);
});

test('Restrykcja pasowania - wataha/anger majority check (dozwolone pasowanie - idealnie w połowie)', () => {
  const set = {
    content: { vampire: 2, werewolf: 1 } // 2 races
  };

  const regions = [
    { pawns: { vampire: [{}, {}], werewolf: [] } } // 2 vampires, 0 werewolf on board
  ];

  const jakub = {
    anger: { vampire: 1, werewolf: 5 } // vampire: 1<=2 (ok), werewolf: 5>0 (violates)
  };

  // 1 of 2 races violates, which is exactly 50%. The rules state this is allowed to pass.
  const canPass = SharedPlacementManager.isSetAllowedToPass(set, regions, jakub);
  assert.strictEqual(canPass, true);
});

test('Restrykcja pasowania - większość spełnia warunek (dozwolone pasowanie)', () => {
  const set = {
    content: { vampire: 2, werewolf: 1, ghost: 1 } // 3 races
  };

  const regions = [
    { pawns: { vampire: [{}, {}], werewolf: [{}], ghost: [] } } // 2 vampires, 1 werewolf on board
  ];

  const jakub = {
    anger: { vampire: 1, werewolf: 1, ghost: 5 } // vampire: 1<=2 (ok), werewolf: 1<=1 (ok), ghost: 5>0 (no)
  };

  // validRaces = 2 (vampire, werewolf), races.length = 3.
  // 2 > 1.5 is true.
  const canPass = SharedPlacementManager.isSetAllowedToPass(set, regions, jakub);
  assert.strictEqual(canPass, true);
});
