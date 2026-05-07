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
  const maxUnits = meta.maxUnitsPerSet || 5;
  const calcPower = (content) => Object.entries(content).reduce((sum, [r, c]) => sum + (powerConfig[r] || 0) * c, 0);
  const countUnits = (content) => Object.values(content).reduce((a, b) => a + b, 0);
  const canAdd = (content, race) => {
    if (totals[race] <= 0 || countUnits(content) >= maxUnits || (content[race] || 0) >= PAWN_CONSTRAINTS[race] || calcPower({ ...content, [race]: (content[race] || 0) + 1 }) > maxPower) return false;
    return true;
  };
  while (RACES.some(r => totals[r] > 0)) {
    let content = {};
    const availableFirst = RACES.filter(r => totals[r] > 0);
    if (availableFirst.length === 0) break;
    const firstRace = availableFirst[Math.floor(Math.random() * availableFirst.length)];
    content[firstRace] = 1; totals[firstRace]--;
    let adding = true;
    while (adding) {
      if (calcPower(content) >= maxPower || countUnits(content) >= maxUnits) break;
      let pawnAddedThisPass = false;
      for (const race of REVERSE_RACES) {
        if (canAdd(content, race)) {
          if (Math.random() < 0.5) { content[race] = (content[race] || 0) + 1; totals[race]--; pawnAddedThisPass = true; break; }
        }
      }
      if (!pawnAddedThisPass) adding = false;
    }
    items.push({ id: 0, content, used: false, power: calcPower(content), ownerId: null });
  }
  const result = { pawns: pawnsConfig, pawnsInPlayLimit: (meta.pawnsInPlayLimit || PAWNS_IN_PLAY_LIMIT), power: powerConfig, maxPower, maxUnitsPerSet: maxUnits, drawPile: items, discardPile: [], heldSets: [], setName: 'generated', ...meta };
  return sortSetsData(result);
};
