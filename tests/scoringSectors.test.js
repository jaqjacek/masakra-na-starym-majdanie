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

  // 4. Sektor (3,1) -> odległość 2
  const index31 = 1 * 6 + 3; // 9
  const scoresAt31 = Scoring.calculatePlacementPoints(regions, regions[index31], setContent);
  assert.deepStrictEqual(scoresAt31, {
    V: 2, // (4 - 2) * 1
    W: 1, // 1 (bazowy) + 0 (za watahę) + 0 (brak premii za bliskość)
    G: 1, // 2 - 1 (odległość do krawędzi) - 0 (brak kary Jakuba) = 1
    B: 1  // odległość 2 > 1 -> 1
  });

  // 5. Sektor (1,3) -> odległość 2
  const index13 = 3 * 6 + 1; // 19
  const scoresAt13 = Scoring.calculatePlacementPoints(regions, regions[index13], setContent);
  assert.deepStrictEqual(scoresAt13, {
    V: 2, // (4 - 2) * 1
    W: 1, // 1 (bazowy) + 0 (za watahę) + 0 (brak premii za bliskość)
    G: 1, // 2 - 1 (odległość do krawędzi) - 0 (brak kary Jakuba) = 1
    B: 1  // odległość 2 > 1 -> 1
  });
});

test('Punktacja Wilkołaków w watahach wokół sektora (3,1)', () => {
  const board = new Board(6);
  const regions = board.generateEmpty();

  // Place Jakub at (1,1) -> index 7
  const jakubIndex = 1 * 6 + 1; // 7
  regions[jakubIndex].pawns.jakub = [{ range: 1, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }];

  // Sektor (3,1) -> index 9
  const index31 = 1 * 6 + 3; // 9
  
  // Place 1 werewolf in each of the 8 neighbors of (3,1)
  regions[index31].neighbors.forEach(nIdx => {
    regions[nIdx].pawns.werewolf = [{}];
  });

  // Play a set with 1 werewolf
  const setContent = { werewolf: 1 };

  const scores = Scoring.calculatePlacementPoints(regions, regions[index31], setContent);

  // Total werewolves = 1 (placed) + 8 (neighbors) = 9
  // Points = 1 (base) + 0 (Jakub dist=2) + Math.floor(9 / 3) = 4 points
  assert.strictEqual(scores.W, 4);
});

test('Punktacja dla zestawów z wieloma Wilkołakami (wCount = 2, 3)', () => {
  const board = new Board(6);
  const regions = board.generateEmpty();

  // Place Jakub at (1,1) -> index 7
  const jakubIndex = 1 * 6 + 1; // 7
  regions[jakubIndex].pawns.jakub = [{ range: 1, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }];

  // 1. Zestaw z 2 wilkołakami w regionie z Jakubem (odległość 0) na pustej planszy:
  // 2 (bazowe) + 2 (bliskość Jakuba) + 0 (wataha 2/3) = 4 pkt
  const scores2AtJakub = Scoring.calculatePlacementPoints(regions, regions[jakubIndex], { werewolf: 2 });
  assert.strictEqual(scores2AtJakub.W, 4);

  // 2. Zestaw z 2 wilkołakami w regionie sąsiednim do Jakuba (0,0) -> odległość 1 na pustej planszy:
  // 2 (bazowe) + 2 (bliskość Jakuba) + 0 (wataha 2/3) = 4 pkt
  const index00 = 0 * 6 + 0;
  const scores2At00 = Scoring.calculatePlacementPoints(regions, regions[index00], { werewolf: 2 });
  assert.strictEqual(scores2At00.W, 4);

  // 3. Zestaw z 2 wilkołakami w odległości 2 (3,1) na pustej planszy:
  // 2 (bazowe) + 0 (brak bliskości) + 0 (wataha 2/3) = 2 pkt
  const index31 = 1 * 6 + 3;
  const scores2At31 = Scoring.calculatePlacementPoints(regions, regions[index31], { werewolf: 2 });
  assert.strictEqual(scores2At31.W, 2);

  // 4. Zestaw z 2 wilkołakami w odległości 1 (0,0) z 4 wilkołakami u sąsiadów (łącznie 6 wilkołaków):
  // 2 (bazowe) + 2 (bliskość Jakuba) + Math.floor(6 / 3) = 6 pkt
  regions[index00].neighbors[0] && (regions[regions[index00].neighbors[0]].pawns.werewolf = [{}, {}]);
  regions[index00].neighbors[1] && (regions[regions[index00].neighbors[1]].pawns.werewolf = [{}, {}]);
  const scores2At00WithPack = Scoring.calculatePlacementPoints(regions, regions[index00], { werewolf: 2 });
  assert.strictEqual(scores2At00WithPack.W, 6);
});

