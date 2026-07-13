import test from 'node:test';
import assert from 'node:assert';
import { Board } from '../src/constants/board.js';
import { Scoring } from '../shared/scoring/scoring.js';

test('Punktacja w różnych sektorach w odniesieniu do Jakuba na (1,1)', () => {
  const board = new Board(6);
  const regions = board.generateEmpty();

  // Place Jakub in sector (1,1) -> index 7
  const jakubIndex = 1 * 6 + 1; // 7
  regions[jakubIndex].pawns.jakub = [{ range: 1, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }];

  const setContent = { vampire: 1, werewolf: 1, ghost: 1, bardak: 1 };

  // 1. Sektor z Jakubem (1,1) -> odległość 0
  const scoresAtJakub = Scoring.calculatePlacementPoints(regions, regions[jakubIndex], setContent);
  assert.deepStrictEqual(scoresAtJakub, {
    V: 4, // (4 - 0) * 1
    W: 2, // 1 (bazowy) + 0 (za watahę) + 1 (premia za bliskość)
    G: 0, // 2 - 1 (odległość do krawędzi) - 1 (kara bliskości Jakuba) = 0
    B: 0  // odległość 0 <= 1 -> 0
  });

  // 2. Sektor (0,0) -> odległość 1
  const index00 = 0 * 6 + 0; // 0
  const scoresAt00 = Scoring.calculatePlacementPoints(regions, regions[index00], setContent);
  assert.deepStrictEqual(scoresAt00, {
    V: 3, // (4 - 1) * 1
    W: 2, // 1 (bazowy) + 0 (za watahę) + 1 (premia za bliskość)
    G: 1, // 2 - 0 (odległość do krawędzi) - 1 (kara bliskości Jakuba) = 1
    B: 0  // odległość 1 <= 1 -> 0
  });

  // 3. Sektor (5,5) -> odległość 4
  const index55 = 5 * 6 + 5; // 35
  const scoresAt55 = Scoring.calculatePlacementPoints(regions, regions[index55], setContent);
  assert.deepStrictEqual(scoresAt55, {
    V: 0, // (4 - 4) * 1
    W: 1, // 1 (bazowy) + 0 (za watahę) + 0 (brak premii za bliskość)
    G: 2, // 2 - 0 (odległość do krawędzi) - 0 (brak kary Jakuba) = 2
    B: 1  // odległość 4 > 1 -> 1
  });
});
