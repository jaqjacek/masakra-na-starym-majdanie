import { generateSetData } from '../server/setManager.js';
import { INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG } from '../server/constants.js';

console.log('--- STARTING SET GENERATION TEST ---');

// Generate set using default pools and maxPower=6
const maxPower = 6;
const data = generateSetData(INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, maxPower);

const sets = data.drawPile;
console.log(`Total generated sets: ${sets.length}`);

// Validation stats
let errors = 0;
let vampire2Sets = 0;
let werewolf2Sets = 0;
let ghost3Sets = 0;
let bardak4Sets = 0;
let allRacesSets = 0;
let setsOver4Units = 0;

sets.forEach((set, index) => {
  const c = set.content;
  const unitCount = Object.values(c).reduce((a, b) => a + b, 0);
  const raceCount = Object.keys(c).length;
  
  if (unitCount > 4) {
    console.error(`Error: Set #${index} has more than 4 pawns:`, c);
    setsOver4Units++;
    errors++;
  }
  
  // Count matches for mandatory configs
  if (c.vampire === 2 && unitCount === 2) vampire2Sets++;
  if (c.werewolf === 2 && unitCount === 2) werewolf2Sets++;
  if (c.ghost === 3 && unitCount === 3) ghost3Sets++;
  if (c.bardak === 4 && unitCount === 4) bardak4Sets++;
  if (c.vampire === 1 && c.werewolf === 1 && c.ghost === 1 && c.bardak === 1 && unitCount === 4) allRacesSets++;
  
  // Check unexpected large groups in generated sets (non-mandatory duplicates)
  if (c.vampire > 1 && !(c.vampire === 2 && unitCount === 2)) {
    console.error(`Error: Set #${index} has multiple vampires unexpectedly:`, c);
    errors++;
  }
  if (c.werewolf > 1 && !(c.werewolf === 2 && unitCount === 2)) {
    console.error(`Error: Set #${index} has multiple werewolves unexpectedly:`, c);
    errors++;
  }
  if (c.ghost > 2 && !(c.ghost === 3 && unitCount === 3)) {
    console.error(`Error: Set #${index} has too many ghosts unexpectedly:`, c);
    errors++;
  }
  if (c.bardak >= 4 && !(c.bardak === 4 && unitCount === 4)) {
    console.error(`Error: Set #${index} has too many bardaks unexpectedly:`, c);
    errors++;
  }
  if (raceCount === 4 && !(c.vampire === 1 && c.werewolf === 1 && c.ghost === 1 && c.bardak === 1 && unitCount === 4)) {
    console.error(`Error: Set #${index} has all 4 races unexpectedly:`, c);
    errors++;
  }
});

// Enforce specific counts
console.log(`\nMandatory checks:`);
console.log(`- Sets with exactly 2 Vampires: ${vampire2Sets} (Expected: >= 1)`);
console.log(`- Sets with exactly 2 Werewolves: ${werewolf2Sets} (Expected: 1)`);
console.log(`- Sets with exactly 3 Ghosts: ${ghost3Sets} (Expected: 2)`);
console.log(`- Sets with exactly 4 Bardaks: ${bardak4Sets} (Expected: 1)`);
console.log(`- Sets containing all 4 races: ${allRacesSets} (Expected: 1)`);

if (sets.length > 50) {
  console.error(`Error: Total sets (${sets.length}) exceeds maximum limit of 50.`);
  errors++;
}
if (vampire2Sets < 1) {
  console.error(`Error: Missing mandatory set with 2 vampires.`);
  errors++;
}
if (werewolf2Sets !== 1) {
  console.error(`Error: Should have exactly 1 set with 2 werewolves, got ${werewolf2Sets}.`);
  errors++;
}
if (ghost3Sets !== 2) {
  console.error(`Error: Should have exactly 2 sets with 3 ghosts, got ${ghost3Sets}.`);
  errors++;
}
if (bardak4Sets !== 1) {
  console.error(`Error: Should have exactly 1 set with 4 bardaks, got ${bardak4Sets}.`);
  errors++;
}
if (allRacesSets !== 1) {
  console.error(`Error: Should have exactly 1 set with all 4 races, got ${allRacesSets}.`);
  errors++;
}

if (errors === 0) {
  console.log('\nSUCCESS: All set generation checks passed successfully!');
  process.exit(0);
} else {
  console.error(`\nFAILURE: Found ${errors} validation errors.`);
  process.exit(1);
}
