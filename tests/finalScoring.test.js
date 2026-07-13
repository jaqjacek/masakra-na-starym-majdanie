import test from 'node:test';
import assert from 'node:assert';
import { VampireScoring } from '../shared/scoring/vampireScoring.js';
import { WerewolfScoring } from '../shared/scoring/werewolfScoring.js';
import { GhostScoring } from '../shared/scoring/ghostScoring.js';
import { BardakScoring } from '../shared/scoring/bardakScoring.js';

test('Punktacja Końcowa - Wampiry (2 punkty za każdy sektor z wampirami)', () => {
  const regions = [
    { pawns: { vampire: [{}, {}] } }, // Sektor 1: ma wampiry
    { pawns: { vampire: [{}] } },     // Sektor 2: ma wampiry
    { pawns: {} }                     // Sektor 3: brak
  ];

  const points = VampireScoring.calculateFinal(regions);
  // 2 sektory z wampirami * 2 punkty = 4 punkty
  assert.strictEqual(points, 4);
});

test('Punktacja Końcowa - Wilkołaki (1 punkt za każdego wilkołaka na planszy)', () => {
  const regions = [
    { pawns: { werewolf: [{}, {}] } },
    { pawns: { werewolf: [{}, {}, {}] } },
    { pawns: {} }
  ];

  const points = WerewolfScoring.calculateFinal(regions);
  // Łącznie 5 wilkołaków = 5 punktów
  assert.strictEqual(points, 5);
});

test('Punktacja Końcowa - Duchy (solowanie lub większość)', () => {
  const regions = [
    // Sektor 1: Duch jest sam (solowanie) -> +2 pkt
    { pawns: { ghost: [{}] } },
    // Sektor 2: Duch ma przewagę nad innymi (3 > 2) -> +1 pkt
    { pawns: { ghost: [{}, {}, {}], vampire: [{}, {}] } },
    // Sektor 3: Duch nie ma przewagi (2 nie jest > 2) -> 0 pkt
    { pawns: { ghost: [{}, {}], werewolf: [{}, {}] } }
  ];

  const points = GhostScoring.calculateFinal(regions);
  assert.strictEqual(points, 3);
});

test('Punktacja Końcowa - Bardaki (większość w sektorze)', () => {
  const regions = [
    // Sektor 1: Bardak ma przewagę nad innymi (3 > 2) -> +1 pkt
    { pawns: { bardak: [{}, {}, {}], ghost: [{}, {}] } },
    // Sektor 2: Bardak nie ma przewagi (1 nie jest > 2) -> 0 pkt
    { pawns: { bardak: [{}], vampire: [{}, {}] } },
    // Sektor 3: Sam Bardak (większość 1 > 0) -> +1 pkt
    { pawns: { bardak: [{}] } }
  ];

  const points = BardakScoring.calculateFinal(regions);
  assert.strictEqual(points, 2);
});
