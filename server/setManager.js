import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RACES, PAWN_CONSTRAINTS, INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, PAWNS_IN_PLAY_LIMIT } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETS_DIR = path.join(__dirname, 'sets');
const CONFIGS_DIR = path.join(__dirname, 'configs');

export const loadSetFile = (setName) => {
  let setPath = path.join(SETS_DIR, `${setName}.json`);
  if (setName === 'set_default') setPath = path.join(CONFIGS_DIR, 'set_default.json');
  if (fs.existsSync(setPath)) {
    const data = JSON.parse(fs.readFileSync(setPath, 'utf8'));
    data.setName = setName;
    if (!data.pawnsInPlayLimit) data.pawnsInPlayLimit = data.pawns || INITIAL_PAWN_POOL;
    return data;
  }
  return null;
};

export const sortSetsData = (setsData) => {
  if (!setsData.drawPile) return setsData;
  const removeEmpty = (pile) => {
    if (!pile) return [];
    return pile.filter(s => Object.values(s.content || {}).reduce((a, b) => a + b, 0) > 0);
  };
  setsData.drawPile = removeEmpty(setsData.drawPile);
  setsData.heldSets = removeEmpty(setsData.heldSets);
  setsData.discardPile = removeEmpty(setsData.discardPile);

  if (setsData.drawPile.length > 0) {
    setsData.drawPile.sort((a, b) => {
      let scoreA = 0; let scoreB = 0;
      RACES.forEach((race, index) => {
        const bitValue = 1 << (RACES.length - 1 - index);
        if (a.content[race]) scoreA += bitValue;
        if (b.content[race]) scoreB += bitValue;
      });
      if (scoreA !== scoreB) return scoreB - scoreA;
      for (const race of RACES) {
        const countA = a.content[race] || 0; const countB = b.content[race] || 0;
        if (countA !== countB) return countB - countA;
      }
      return 0;
    });
  }
  let globalIndex = 1;
  const processPile = (pile) => { if (pile) pile.forEach(s => { s.id = globalIndex++; }); };
  processPile(setsData.drawPile); processPile(setsData.heldSets); processPile(setsData.discardPile);
  return setsData;
};

export const generateSetData = (pawnsConfig, powerConfig, maxPower, meta = {}) => {
  const totals = { ...pawnsConfig };
  const items = [];
  const REVERSE_RACES = [...RACES].reverse();
  const maxUnits = 4; // Capped at 4 pawns per set for regular generation
  
  const calcPower = (content) => Object.entries(content).reduce((sum, [r, c]) => sum + (powerConfig[r] || 0) * c, 0);
  const countUnits = (content) => Object.values(content).reduce((a, b) => a + b, 0);
  const countDistinctRaces = (content) => Object.keys(content).length;

  // Enforce constraints on general generation:
  // - Capped at 4 units total per set.
  // - Adheres to PAWN_CONSTRAINTS (vampire <= 1, werewolf <= 1, ghost <= 2).
  // - Number of distinct races <= 3 (to prevent any other set from containing all 4 races).
  // - Capped at 3 bardaks (to prevent any other set from containing 4 bardaks).
  const canAdd = (content, race) => {
    if (totals[race] <= 0) return false;
    if (countUnits(content) >= maxUnits) return false;
    if ((content[race] || 0) >= PAWN_CONSTRAINTS[race]) return false;
    
    // Max 3 races check
    if (!content[race] && countDistinctRaces(content) >= 3) return false;
    
    // Max 3 bardaks check
    if (race === 'bardak' && (content.bardak || 0) >= 3) return false;
    
    if (calcPower({ ...content, [race]: (content[race] || 0) + 1 }) > maxPower) return false;
    return true;
  };

  // 1. Create Mandatory Sets if we have sufficient pawns:
  // - A minimum one set that will contain 2 vampires
  if (totals.vampire >= 2) {
    const content = { vampire: 2 };
    totals.vampire -= 2;
    items.push({ id: 0, content, used: false, power: calcPower(content), ownerId: null });
  }
  // - One set that will contain 2 werewolves
  if (totals.werewolf >= 2) {
    const content = { werewolf: 2 };
    totals.werewolf -= 2;
    items.push({ id: 0, content, used: false, power: calcPower(content), ownerId: null });
  }
  // - Two sets that will contain 3 ghosts each
  for (let i = 0; i < 2; i++) {
    if (totals.ghost >= 3) {
      const content = { ghost: 3 };
      totals.ghost -= 3;
      items.push({ id: 0, content, used: false, power: calcPower(content), ownerId: null });
    }
  }
  // - One and only one set that will contain 4 bardaks
  if (totals.bardak >= 4) {
    const content = { bardak: 4 };
    totals.bardak -= 4;
    items.push({ id: 0, content, used: false, power: calcPower(content), ownerId: null });
  }
  // - One and only one set that will contain all 4 races
  if (totals.vampire >= 1 && totals.werewolf >= 1 && totals.ghost >= 1 && totals.bardak >= 1) {
    const content = { vampire: 1, werewolf: 1, ghost: 1, bardak: 1 };
    totals.vampire -= 1;
    totals.werewolf -= 1;
    totals.ghost -= 1;
    totals.bardak -= 1;
    items.push({ id: 0, content, used: false, power: calcPower(content), ownerId: null });
  }

  // 2. Generate the rest of the sets, up to a hard cap of 50 total sets
  while (items.length < 50 && RACES.some(r => totals[r] > 0)) {
    let content = {};
    const availableFirst = RACES.filter(r => totals[r] > 0 && canAdd(content, r));
    if (availableFirst.length === 0) break;
    const firstRace = availableFirst[Math.floor(Math.random() * availableFirst.length)];
    content[firstRace] = 1; totals[firstRace]--;
    
    let adding = true;
    while (adding) {
      if (calcPower(content) >= maxPower || countUnits(content) >= maxUnits) break;
      let pawnAddedThisPass = false;
      for (const race of REVERSE_RACES) {
        if (canAdd(content, race)) {
          if (Math.random() < 0.5) { 
            content[race] = (content[race] || 0) + 1; 
            totals[race]--; 
            pawnAddedThisPass = true; 
            break; 
          }
        }
      }
      if (!pawnAddedThisPass) adding = false;
    }
    items.push({ id: 0, content, used: false, power: calcPower(content), ownerId: null });
  }

  const result = { 
    pawns: pawnsConfig, 
    pawnsInPlayLimit: (meta.pawnsInPlayLimit || PAWNS_IN_PLAY_LIMIT), 
    power: powerConfig, 
    maxPower, 
    maxUnitsPerSet: maxUnits, 
    drawPile: items, 
    discardPile: [], 
    heldSets: [], 
    setName: 'generated', 
    ...meta 
  };
  return sortSetsData(result);
};
