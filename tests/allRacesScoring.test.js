import test from 'node:test';
import assert from 'node:assert';
import { Board } from '../src/constants/board.js';
import { Scoring } from '../shared/scoring/scoring.js';
import { VampireScoring } from '../shared/scoring/vampireScoring.js';
import { WerewolfScoring } from '../shared/scoring/werewolfScoring.js';
import { GhostScoring } from '../shared/scoring/ghostScoring.js';
import { BardakScoring } from '../shared/scoring/bardakScoring.js';

test('Punktacja Wampirów dla różnej liczby pionków (1, 2, 3)', () => {
  // Wzór: (4 - dist) * vCount

  // 1 wampir
  assert.strictEqual(VampireScoring.calculate(0, 1), 4);
  assert.strictEqual(VampireScoring.calculate(1, 1), 3);
  assert.strictEqual(VampireScoring.calculate(2, 1), 2);
  assert.strictEqual(VampireScoring.calculate(3, 1), 1);
  assert.strictEqual(VampireScoring.calculate(4, 1), 0);
  assert.strictEqual(VampireScoring.calculate(5, 1), -1);

  // 2 wampiry
  assert.strictEqual(VampireScoring.calculate(0, 2), 8);
  assert.strictEqual(VampireScoring.calculate(1, 2), 6);
  assert.strictEqual(VampireScoring.calculate(2, 2), 4);
  assert.strictEqual(VampireScoring.calculate(4, 2), 0);
  assert.strictEqual(VampireScoring.calculate(5, 2), -2);

  // 3 wampiry
  assert.strictEqual(VampireScoring.calculate(0, 3), 12);
  assert.strictEqual(VampireScoring.calculate(1, 3), 9);
  assert.strictEqual(VampireScoring.calculate(2, 3), 6);
  assert.strictEqual(VampireScoring.calculate(5, 3), -3);

  // 0 wampirów
  assert.strictEqual(VampireScoring.calculate(0, 0), 0);
});

test('Punktacja Bardaków dla różnej liczby pionków (1, 2, 3)', () => {
  // Wzór: dist <= 1 -> 0, dist > 1 -> bCount

  // 1 bardak
  assert.strictEqual(BardakScoring.calculate(0, 1), 0);
  assert.strictEqual(BardakScoring.calculate(1, 1), 0);
  assert.strictEqual(BardakScoring.calculate(2, 1), 1);
  assert.strictEqual(BardakScoring.calculate(4, 1), 1);
  assert.strictEqual(BardakScoring.calculate(5, 1), 1);

  // 2 bardaki
  assert.strictEqual(BardakScoring.calculate(0, 2), 0);
  assert.strictEqual(BardakScoring.calculate(1, 2), 0);
  assert.strictEqual(BardakScoring.calculate(2, 2), 2);
  assert.strictEqual(BardakScoring.calculate(3, 2), 2);
  assert.strictEqual(BardakScoring.calculate(5, 2), 2);

  // 3 bardaki
  assert.strictEqual(BardakScoring.calculate(0, 3), 0);
  assert.strictEqual(BardakScoring.calculate(1, 3), 0);
  assert.strictEqual(BardakScoring.calculate(2, 3), 3);
  assert.strictEqual(BardakScoring.calculate(5, 3), 3);

  // 0 bardaków
  assert.strictEqual(BardakScoring.calculate(3, 0), 0);
});

test('Punktacja Duchów dla różnej liczby pionków (1, 2, 3)', () => {
  // Wzór: (2 - distToEdge - (dist <= jakubRange ? 1 : 0)) * gCount

  const edgeRegion = { x: 0, y: 0 };      // distToEdge = 0
  const midRegion = { x: 1, y: 1 };       // distToEdge = 1
  const centerRegion = { x: 2, y: 2 };    // distToEdge = 2

  const jakubRange = 1;

  // 1. Krawędź (distToEdge = 0)
  // Bez kary Jakuba (dist = 3) -> 2 * gCount
  assert.strictEqual(GhostScoring.calculate(edgeRegion, 3, jakubRange, 1), 2);
  assert.strictEqual(GhostScoring.calculate(edgeRegion, 3, jakubRange, 2), 4);
  assert.strictEqual(GhostScoring.calculate(edgeRegion, 3, jakubRange, 3), 6);

  // Z karą Jakuba (dist = 1) -> (2 - 1) * gCount = 1 * gCount
  assert.strictEqual(GhostScoring.calculate(edgeRegion, 1, jakubRange, 1), 1);
  assert.strictEqual(GhostScoring.calculate(edgeRegion, 1, jakubRange, 2), 2);
  assert.strictEqual(GhostScoring.calculate(edgeRegion, 1, jakubRange, 3), 3);

  // 2. 1 krok od krawędzi (distToEdge = 1)
  // Bez kary Jakuba (dist = 3) -> (2 - 1) * gCount = 1 * gCount
  assert.strictEqual(GhostScoring.calculate(midRegion, 3, jakubRange, 1), 1);
  assert.strictEqual(GhostScoring.calculate(midRegion, 3, jakubRange, 2), 2);
  assert.strictEqual(GhostScoring.calculate(midRegion, 3, jakubRange, 3), 3);

  // Z karą Jakuba (dist = 1) -> (2 - 1 - 1) * gCount = 0
  assert.strictEqual(GhostScoring.calculate(midRegion, 1, jakubRange, 1), 0);
  assert.strictEqual(GhostScoring.calculate(midRegion, 1, jakubRange, 2), 0);
  assert.strictEqual(GhostScoring.calculate(midRegion, 1, jakubRange, 3), 0);

  // 3. Centrum planszy (distToEdge = 2)
  // Bez kary Jakuba (dist = 3) -> (2 - 2) * gCount = 0
  assert.strictEqual(GhostScoring.calculate(centerRegion, 3, jakubRange, 1), 0);
  assert.strictEqual(GhostScoring.calculate(centerRegion, 3, jakubRange, 2), 0);
  assert.strictEqual(GhostScoring.calculate(centerRegion, 3, jakubRange, 3), 0);

  // Z karą Jakuba (dist = 0) -> (2 - 2 - 1) * gCount = -1 * gCount
  assert.strictEqual(GhostScoring.calculate(centerRegion, 0, jakubRange, 1), -1);
  assert.strictEqual(GhostScoring.calculate(centerRegion, 0, jakubRange, 2), -2);
  assert.strictEqual(GhostScoring.calculate(centerRegion, 0, jakubRange, 3), -3);

  // 0 duchów
  assert.strictEqual(GhostScoring.calculate(edgeRegion, 3, jakubRange, 0), 0);
});

test('Punktacja Wilkołaków dla różnej liczby pionków (1, 2, 3) i watahy', () => {
  const board = new Board(6);
  const regions = board.generateEmpty();
  const target = regions[0];

  // 1. Pusta plansza - brak innych wilkołaków u sąsiadów
  // Blisko Jakuba (dist <= 1): wCount (baza) + wCount (premia) + floor(wCount/3)
  assert.strictEqual(WerewolfScoring.calculate(regions, target, 0, 1), 2); // 1 + 1 + 0 = 2
  assert.strictEqual(WerewolfScoring.calculate(regions, target, 1, 2), 4); // 2 + 2 + 0 = 4
  assert.strictEqual(WerewolfScoring.calculate(regions, target, 1, 3), 7); // 3 + 3 + 1 = 7

  // Daleko od Jakuba (dist > 1): wCount (baza) + 0 (brak premii) + floor(wCount/3)
  assert.strictEqual(WerewolfScoring.calculate(regions, target, 2, 1), 1); // 1 + 0 + 0 = 1
  assert.strictEqual(WerewolfScoring.calculate(regions, target, 2, 2), 2); // 2 + 0 + 0 = 2
  assert.strictEqual(WerewolfScoring.calculate(regions, target, 3, 3), 4); // 3 + 0 + 1 = 4

  // 0 wilkołaków
  assert.strictEqual(WerewolfScoring.calculate(regions, target, 1, 0), 0);
});

test('Punktacja zestawów mieszanych przez calculatePlacementPoints', () => {
  const board = new Board(6);
  const regions = board.generateEmpty();

  // Place Jakub at (1,1) -> index 7
  const jakubIndex = 1 * 6 + 1; // 7
  regions[jakubIndex].pawns.jakub = [{ range: 1, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }];

  // Sektor z Jakubem (1,1) -> dist = 0, distToEdge = 1
  const setMulti = { vampire: 2, werewolf: 2, ghost: 2, bardak: 2 };
  const scoreAtJakub = Scoring.calculatePlacementPoints(regions, regions[jakubIndex], setMulti);

  assert.deepStrictEqual(scoreAtJakub, {
    V: (4 - 0) * 2,                                // 8
    W: 2 + 2 + 0,                                  // 4
    G: (2 - 1 - 1) * 2,                            // 0
    B: 0                                           // 0 (bo dist <= 1)
  });

  // Sektor narożny (0,0) -> dist = 1, distToEdge = 0
  const scoreAt00 = Scoring.calculatePlacementPoints(regions, regions[0], setMulti);
  assert.deepStrictEqual(scoreAt00, {
    V: (4 - 1) * 2,                                // 6
    W: 2 + 2 + 0,                                  // 4
    G: (2 - 0 - 1) * 2,                            // 2
    B: 0                                           // 0 (bo dist <= 1)
  });

  // Sektor daleki narożny (5,5) -> dist = 4, distToEdge = 0
  const scoreAt55 = Scoring.calculatePlacementPoints(regions, regions[35], setMulti);
  assert.deepStrictEqual(scoreAt55, {
    V: (4 - 4) * 2,                                // 0
    W: 2 + 0 + 0,                                  // 2
    G: (2 - 0 - 0) * 2,                            // 4
    B: 2                                           // 2 (bo dist > 1)
  });
});

test('Punktacja Duchów na ścianach poziomych (góra/dół) i pionowych (lewo/prawo)', () => {
  const board = new Board(6);
  const regions = board.generateEmpty();

  // Jakub w centrum (2,2) -> index 14
  const jakubIdx = 2 * 6 + 2;
  regions[jakubIdx].pawns.jakub = [{ range: 1, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }];

  // 1. Ściana pozioma górna (x: 2, y: 0) -> dist = 2 (bezpieczny), distToEdge = 0
  const topIdx = 0 * 6 + 2; // (2,0)
  const topScore = Scoring.calculatePlacementPoints(regions, regions[topIdx], { ghost: 1 });
  assert.strictEqual(topScore.G, 2, 'Top wall should give 2 points for 1 ghost');

  // 2. Ściana pozioma dolna (x: 2, y: 5) -> dist = 3 (bezpieczny), distToEdge = 0
  const bottomIdx = 5 * 6 + 2; // (2,5)
  const bottomScore = Scoring.calculatePlacementPoints(regions, regions[bottomIdx], { ghost: 1 });
  assert.strictEqual(bottomScore.G, 2, 'Bottom wall should give 2 points for 1 ghost');

  // 3. Ściana pionowa lewa (x: 0, y: 2) -> dist = 2 (bezpieczny), distToEdge = 0
  const leftIdx = 2 * 6 + 0; // (0,2)
  const leftScore = Scoring.calculatePlacementPoints(regions, regions[leftIdx], { ghost: 1 });
  assert.strictEqual(leftScore.G, 2, 'Left wall should give 2 points for 1 ghost');

  // 4. Ściana pionowa prawa (x: 5, y: 2) -> dist = 3 (bezpieczny), distToEdge = 0
  const rightIdx = 2 * 6 + 5; // (5,2)
  const rightScore = Scoring.calculatePlacementPoints(regions, regions[rightIdx], { ghost: 1 });
  assert.strictEqual(rightScore.G, 2, 'Right wall should give 2 points for 1 ghost');

  // Wszystkie 4 ściany dają IDENTYCZNE punkty (2 pkt za 1 ducha, 4 pkt za 2 duchy)
  const multiGhostSet = { ghost: 2 };
  assert.strictEqual(Scoring.calculatePlacementPoints(regions, regions[topIdx], multiGhostSet).G, 4);
  assert.strictEqual(Scoring.calculatePlacementPoints(regions, regions[bottomIdx], multiGhostSet).G, 4);
  assert.strictEqual(Scoring.calculatePlacementPoints(regions, regions[leftIdx], multiGhostSet).G, 4);
  assert.strictEqual(Scoring.calculatePlacementPoints(regions, regions[rightIdx], multiGhostSet).G, 4);

  // 5. Ruch Jakuba: Przenosimy Jakuba na (2, 1) - sąsiaduje z górną ścianą (2,0)
  delete regions[jakubIdx].pawns.jakub;
  const newJakubIdx = 1 * 6 + 2; // (2,1)
  regions[newJakubIdx].pawns.jakub = [{ range: 1, anger: {} }];

  // Teraz górna ściana ma dist = 1 (kara Jakuba -> 2 - 1 = 1 pkt)
  const topScoreNearJakub = Scoring.calculatePlacementPoints(regions, regions[topIdx], { ghost: 1 });
  assert.strictEqual(topScoreNearJakub.G, 1, 'Top wall near Jakub gives 1 point');

  // A lewa ściana (0,2) ma dist = 2 (bezpieczna -> 2 pkt)
  const leftScoreFarJakub = Scoring.calculatePlacementPoints(regions, regions[leftIdx], { ghost: 1 });
  assert.strictEqual(leftScoreFarJakub.G, 2, 'Left wall far from Jakub gives 2 points');
});

