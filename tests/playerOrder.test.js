import test from 'node:test';
import assert from 'node:assert';

test('Kolejność graczy - Faza wyboru Hersztów (rosnąco po punktach)', () => {
  const players = [
    { id: 1, name: 'Gracz 1', points: 15 },
    { id: 2, name: 'Gracz 2', points: 5 },
    { id: 3, name: 'Gracz 3', points: 10 }
  ];

  // Wybór liderów: od najmniej punktów do najwięcej
  const selectionOrder = [...players].sort((a, b) => a.points - b.points).map(p => p.id);
  
  assert.deepStrictEqual(selectionOrder, [2, 3, 1]); // Gracz 2 (5) -> Gracz 3 (10) -> Gracz 1 (15)
});

test('Kolejność graczy - Faza wystawiania zestawów (malejąco po punktach)', () => {
  const players = [
    { id: 1, name: 'Gracz 1', points: 15 },
    { id: 2, name: 'Gracz 2', points: 5 },
    { id: 3, name: 'Gracz 3', points: 10 }
  ];

  // Wystawianie zestawów: od najwięcej punktów do najmniej
  const placementOrder = [...players].sort((a, b) => b.points - a.points).map(p => p.id);

  assert.deepStrictEqual(placementOrder, [1, 3, 2]); // Gracz 1 (15) -> Gracz 3 (10) -> Gracz 2 (5)
});
