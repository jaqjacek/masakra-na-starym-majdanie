import test from 'node:test';
import assert from 'node:assert';
import { Board } from '../src/constants/board.js';
import { Scoring } from '../shared/scoring/scoring.js';

test('Generowanie planszy - rozmiar i współrzędne', () => {
  const board = new Board(6);
  const regions = board.generateEmpty();

  // Plansza 6x6 powinna mieć dokładnie 36 sektorów
  assert.strictEqual(regions.length, 36);

  // Sprawdzenie poprawności mapowania współrzędnych x, y
  regions.forEach((r, idx) => {
    assert.strictEqual(r.id, idx);
    assert.strictEqual(r.x, idx % 6);
    assert.strictEqual(r.y, Math.floor(idx / 6));
  });
});

test('Sąsiedztwo sektorów (siatka 8-kierunkowa)', () => {
  const board = new Board(6);
  const regions = board.generateEmpty();

  // 1. Sektor narożny (0,0) -> indeks 0
  // Powinien mieć dokładnie 3 sąsiadów: (1,0)->indeks 1, (0,1)->indeks 6, (1,1)->indeks 7
  const corner = regions[0];
  assert.strictEqual(corner.neighbors.length, 3);
  assert.ok(corner.neighbors.includes(1));
  assert.ok(corner.neighbors.includes(6));
  assert.ok(corner.neighbors.includes(7));

  // 2. Sektor krawędziowy (3,0) -> indeks 3
  // Powinien mieć dokładnie 5 sąsiadów: (2,0)->2, (4,0)->4, (2,1)->8, (3,1)->9, (4,1)->10
  const border = regions[3];
  assert.strictEqual(border.neighbors.length, 5);
  assert.ok(border.neighbors.includes(2));
  assert.ok(border.neighbors.includes(4));
  assert.ok(border.neighbors.includes(8));
  assert.ok(border.neighbors.includes(9));
  assert.ok(border.neighbors.includes(10));

  // 3. Sektor wewnętrzny (2,2) -> indeks 14
  // Powinien mieć dokładnie 8 sąsiadów
  const center = regions[14];
  assert.strictEqual(center.neighbors.length, 8);
});

test('Odległość Czebyszewa (Chebyshev Distance)', () => {
  const r1 = { x: 1, y: 1 };
  const r2 = { x: 4, y: 3 };

  // Odległość = max(|1-4|, |1-3|) = max(3, 2) = 3
  const dist = Scoring.getChebyshevDistance(r1, r2);
  assert.strictEqual(dist, 3);
});
