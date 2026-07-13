import test from 'node:test';
import assert from 'node:assert';
import { executeJakubStep } from '../src/strategies/jakubStrategy.js';

test('Zwierzęcy Magnetyzm - dwufazowy ruch i przyciągnięcie pionków', () => {
  const gameState = {
    currentRound: 1,
    phase: 'jakub',
    players: [
      { id: 1, name: 'Gracz 1', generalOf: 'vampire', points: 10 }
    ],
    regions: [
      { id: 0, x: 0, y: 0, pawns: { jakub: [{ range: 1, anger: { vampire: 5, werewolf: 0, ghost: 0, bardak: 0 } }] }, neighbors: [1, 2] },
      { id: 1, x: 1, y: 0, pawns: { vampire: [{}] }, neighbors: [0] },
      { id: 2, x: 0, y: 1, pawns: { vampire: [{}] }, neighbors: [0] }
    ]
  };

  // Krok 1: Wykrycie absolutnego remisu (oba regiony mają po 1 wampirze i te same poziomy furii)
  // Powinno ustawić status magnetismPending i nie zmieniać pozycji pionków ani Jakuba.
  let result = executeJakubStep(gameState);
  let state = result.newState;

  assert.strictEqual(result.actionTaken, true);
  assert.deepStrictEqual(state.jakubMagnetismPending, [1, 2]);
  assert.strictEqual(state.regions[1].pawns.vampire?.length, 1);
  assert.strictEqual(state.regions[2].pawns.vampire?.length, 1);
  assert.strictEqual(state.regions[0].pawns.vampire, undefined);

  // Krok 2: Wykonanie przyciągnięcia magnetycznego w kolejnym kroku
  // Wszystkie pionki z regionów 1 i 2 powinny zostać przyciągnięte do regionu 0 (gdzie stoi Jakub).
  result = executeJakubStep(state);
  state = result.newState;

  assert.strictEqual(result.actionTaken, true);
  assert.strictEqual(state.jakubMagnetismPending, undefined); // status skasowany
  assert.strictEqual(state.regions[0].pawns.vampire?.length, 2); // 2 wampiry w sektorze Jakuba
  assert.strictEqual(state.regions[1].pawns.vampire, undefined); // pole wyczyszczone
  assert.strictEqual(state.regions[2].pawns.vampire, undefined); // pole wyczyszczone
  // Nikt nie dostał punktów świadka, bo magnetyzm nie jest standardowym ruchem opuszczenia pola
  assert.strictEqual(state.players[0].points, 10);

  // Krok 3: Czystka - zabicie PIERWSZEGO wampira (zabijanie pojedyncze na krok)
  result = executeJakubStep(state);
  state = result.newState;

  assert.strictEqual(result.actionTaken, true);
  assert.strictEqual(state.regions[0].pawns.vampire?.length, 1); // 1 wampir pozostał
  assert.strictEqual(state.regions[0].pawns.jakub[0].anger.vampire, 4); // furia zmalała o 1 (z 5 do 4)
  assert.strictEqual(state.players[0].points, 9); // gracz stracił 1 punkt

  // Krok 4: Czystka - zabicie DRUGIEGO wampira (pole staje się czyste)
  result = executeJakubStep(state);
  state = result.newState;

  assert.strictEqual(result.actionTaken, true);
  assert.strictEqual(state.regions[0].pawns.vampire, undefined); // wampiry całkowicie zabite
  assert.strictEqual(state.regions[0].pawns.jakub[0].anger.vampire, 3); // furia zmalała o kolejny 1 (do 3)
  assert.strictEqual(state.players[0].points, 8); // gracz stracił łącznie 2 punkty
});
