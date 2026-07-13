import test from 'node:test';
import assert from 'node:assert';
import { GeneralSelectionManager } from '../shared/generalSelectionManager.js';

test('Dynamiczny wybór Generała - dopasowanie do kart w ręce', () => {
  const availableGenerals = ['vampire', 'werewolf', 'ghost', 'bardak'];
  
  // Hand has 3 vampires, 1 werewolf
  const hand = [
    { content: { vampire: 3, werewolf: 1 } }
  ];
  
  const regions = [];

  const selection = GeneralSelectionManager.chooseGeneral(availableGenerals, hand, regions);

  // Since vampire has higher hand count, it should choose vampire
  assert.strictEqual(selection, 'vampire');
});

test('Dynamiczny wybór Generała - unikanie ról z dużą furią Jakuba', () => {
  const availableGenerals = ['vampire', 'werewolf'];
  
  // Hand has equal counts for vampire and werewolf
  const hand = [
    { content: { vampire: 2, werewolf: 2 } }
  ];
  
  // Region has Jakub with high anger towards vampire, 0 towards werewolf
  const regions = [
    { pawns: { jakub: [{ anger: { vampire: 15, werewolf: 0 } }] } }
  ];

  const selection = GeneralSelectionManager.chooseGeneral(availableGenerals, hand, regions);

  // Vampire is dangerous, werewolf should be chosen
  assert.strictEqual(selection, 'werewolf');
});

test('Dynamiczny wybór Generała - wsparcie obecności na planszy', () => {
  const availableGenerals = ['ghost', 'bardak'];
  
  // Equal hand count
  const hand = [
    { content: { ghost: 1, bardak: 1 } }
  ];
  
  // Ghosts already present on board
  const regions = [
    { pawns: { ghost: [{}, {}], bardak: [] } }
  ];

  const selection = GeneralSelectionManager.chooseGeneral(availableGenerals, hand, regions);

  // Ghost should be chosen due to board presence bonus
  assert.strictEqual(selection, 'ghost');
});
