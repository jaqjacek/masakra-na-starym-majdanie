import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import http from 'http';
import { RACES, DEFAULT_PLAYERS, PAWN_CONSTRAINTS, INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GAMES_DIR = path.join(__dirname, 'games');
const SETS_DIR = path.join(__dirname, 'sets');
const CONFIGS_DIR = path.join(__dirname, 'configs');
const CONFIG_FILE = path.join(CONFIGS_DIR, 'server_config.json');
const BOARD_DEFAULT_FILE = path.join(CONFIGS_DIR, 'board_default.json');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "DELETE"] }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the frontend build
const DIST_PATH = path.join(process.cwd(), 'dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
}

if (!fs.existsSync(GAMES_DIR)) fs.mkdirSync(GAMES_DIR);
if (!fs.existsSync(SETS_DIR)) fs.mkdirSync(SETS_DIR);
if (!fs.existsSync(CONFIGS_DIR)) fs.mkdirSync(CONFIGS_DIR);

const getGlobalConfig = () => {
  if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const defaultConfig = { defaultSetName: null };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  return defaultConfig;
};

const ensureGameDir = (gameId) => {
  const pathDir = path.join(GAMES_DIR, String(gameId));
  if (!fs.existsSync(pathDir)) fs.mkdirSync(pathDir, { recursive: true });
  return pathDir;
};

const loadSetFile = (setName) => {
  let setPath = path.join(SETS_DIR, `${setName}.json`);
  if (setName === 'set_default') setPath = path.join(CONFIGS_DIR, 'set_default.json');
  if (fs.existsSync(setPath)) {
    const data = JSON.parse(fs.readFileSync(setPath, 'utf8'));
    data.setName = setName;
    return data;
  }
  return null;
};

const sortSetsData = (setsData) => {
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

const generateSetData = (pawnsConfig, powerConfig, maxPower, meta = {}) => {
  const totals = { ...pawnsConfig };
  const items = [];
  const REVERSE_RACES = [...RACES].reverse();
  const calcPower = (content) => Object.entries(content).reduce((sum, [r, c]) => sum + (powerConfig[r] || 0) * c, 0);
  const countUnits = (content) => Object.values(content).reduce((a, b) => a + b, 0);
  const canAdd = (content, race) => {
    if (totals[race] <= 0 || countUnits(content) >= 5 || (content[race] || 0) >= PAWN_CONSTRAINTS[race] || calcPower({ ...content, [race]: (content[race] || 0) + 1 }) > maxPower) return false;
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
      if (calcPower(content) >= maxPower || countUnits(content) >= 5) break;
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
  const result = { pawns: pawnsConfig, power: powerConfig, maxPower, drawPile: items, discardPile: [], heldSets: [], setName: 'generated', ...meta };
  return sortSetsData(result);
};

const createEmptyRegions = () => {
  const size = 5; const regions = [];
  for (let i = 0; i < size * size; i++) { regions.push({ id: i, x: i % size, y: Math.floor(i / size), neighbors: [], pawns: {} }); }
  regions.forEach(region => {
    const { x, y } = region;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx; const ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) region.neighbors.push(ny * size + nx);
      }
    }
  });
  const interior = regions.filter(r => r.x > 0 && r.x < 4 && r.y > 0 && r.y < 4).map(r => r.id);
  const rIdx = interior[Math.floor(Math.random() * interior.length)];
  regions[rIdx].pawns.jakub = [{ statuses: ['ENABLED'], speed: 1, range: 1, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }];
  return regions;
};

const getChebyshevDistance = (r1, r2) => { if (!r1 || !r2) return 999; return Math.max(Math.abs(r1.x - r2.x), Math.abs(r1.y - r2.y)); };

const calculateSetPlacementPoints = (race, setContent, targetRegion, jakubRegion, allRegions = []) => {
  const dist = jakubRegion ? getChebyshevDistance(targetRegion, jakubRegion) : 999;
  const count = setContent[race] || 0;
  if (count <= 0 && race !== 'werewolf') return 0;
  if (race === 'vampire') return Math.max(0, 4 - dist) * count;
  if (race === 'werewolf') {
    if (count <= 0) return 0;
    let totalW = count;
    totalW += (targetRegion.pawns?.werewolf?.length || 0);
    targetRegion.neighbors.forEach(nIdx => {
      const neighbor = allRegions[nIdx];
      if (neighbor) totalW += (neighbor.pawns?.werewolf?.length || 0);
    });
    let pts = Math.ceil(totalW / 3);
    if (dist <= 1) pts += 1;
    return pts;
  }
  if (race === 'bardak') {
    if (dist <= 1) return 0;
    return count;
  }
  if (race === 'ghost') {
    const distToEdge = Math.min(targetRegion.x, 4 - targetRegion.x, targetRegion.y, 4 - targetRegion.y);
    let perPawn = 2 - distToEdge;
    const jakubRange = jakubRegion ? jakubRegion.pawns.jakub[0].range : 0;
    if (dist <= jakubRange) perPawn -= 1;
    return Math.max(0, perPawn) * count;
  }
  return 0;
};

const getGameData = (gameId) => {
  const gamePath = ensureGameDir(gameId);
  const mapPath = path.join(gamePath, 'map.json');
  const playersPath = path.join(gamePath, 'players.json');
  const setsPath = path.join(gamePath, 'sets.json');
  const statePath = path.join(gamePath, 'state.json');
  const historyPath = path.join(gamePath, 'history.json');
  let regions = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, 'utf8')) : createEmptyRegions();
  let players = fs.existsSync(playersPath) ? JSON.parse(fs.readFileSync(playersPath, 'utf8')) : JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
  let history = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, 'utf8')) : [];
  let gameState = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { phase: 'setup', currentRound: 1, currentPlayerIndex: 0, playerOrder: [1, 2, 3, 4], passedPlayers: [], availableGenerals: [...RACES], setName: 'default', gameStatus: 'active' };
  let sets;
  if (fs.existsSync(setsPath)) {
    sets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
    if (sets.items && !sets.drawPile) { sets.drawPile = sets.items; delete sets.items; }
    if (!sets.discardPile) sets.discardPile = []; if (!sets.heldSets) sets.heldSets = [];
  } else {
    const defaultSetPath = path.join(CONFIGS_DIR, 'set_default.json');
    if (fs.existsSync(defaultSetPath)) { sets = JSON.parse(fs.readFileSync(defaultSetPath, 'utf8')); sets.setName = 'set_default'; }
    else { const config = getGlobalConfig(); sets = (config.defaultSetName ? loadSetFile(config.defaultSetName) : null) || generateSetData(INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, 6); }
  }
  return { data: { regions, players, sets, history, ...gameState } };
};

const saveFullState = (gameId, data) => {
  const gamePath = ensureGameDir(gameId);
  if (data.regions) fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(data.regions, null, 2));
  if (data.players) fs.writeFileSync(path.join(gamePath, 'players.json'), JSON.stringify(data.players, null, 2));
  if (data.sets) fs.writeFileSync(path.join(gamePath, 'sets.json'), JSON.stringify(data.sets, null, 2));
  if (data.history) {
    fs.writeFileSync(path.join(gamePath, 'history.json'), JSON.stringify(data.history, null, 2));
    const logContent = data.history.map(h => {
      const racePrefix = h.race ? ` [${h.race.toUpperCase()}]` : '';
      const pointsSuffix = h.points !== undefined ? ` (${h.points > 0 ? '+' : ''}${h.points} pts)` : '';
      return `[${h.time}]${racePrefix} ${h.text}${pointsSuffix}`;
    }).join('\n');
    fs.writeFileSync(path.join(gamePath, 'history.log'), logContent);
  }
  const meta = {}; const keys = ['phase', 'currentRound', 'currentPlayerIndex', 'playerOrder', 'passedPlayers', 'availableGenerals', 'setName', 'gameStatus', 'jakubAngerIncreased', 'jakubTurnExecuted'];
  keys.forEach(k => { if (data[k] !== undefined) meta[k] = data[k]; });
  fs.writeFileSync(path.join(gamePath, 'state.json'), JSON.stringify(meta, null, 2));
};

app.get('/api/config', (req, res) => res.json(getGlobalConfig()));
app.get('/api/next-game-id', (req, res) => {
  try { if (!fs.existsSync(GAMES_DIR)) return res.json({ id: 1 }); const dirs = fs.readdirSync(GAMES_DIR); const ids = dirs.map(d => parseInt(d)).filter(n => !isNaN(n)); const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1; res.json({ id: nextId }); }
  catch (_err) { res.status(500).json({ error: 'Failed' }); }
});
app.post('/api/config', (req, res) => { const config = getGlobalConfig(); if (req.body.defaultSetName !== undefined) config.defaultSetName = req.body.defaultSetName; fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2)); res.json(config); });
app.get('/api/sets', (req, res) => { try { res.json(fs.readdirSync(SETS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))); } catch (err) { res.status(500).json({ error: 'Failed' }); } });
app.get('/api/sets/details/:setName', (req, res) => { try { res.json(loadSetFile(req.params.setName)); } catch (err) { res.status(500).json({ error: 'Failed' }); } });
app.post('/api/sets/generate', (req, res) => {
  try {
    const { pawns, power, maxPower, displayName, description } = req.body;
    const files = fs.readdirSync(SETS_DIR).filter(f => f.startsWith('set_') && f.endsWith('.json'));
    let nextId = 1; const ids = files.map(f => parseInt(f.replace('set_', '').replace('.json', ''))).filter(n => !isNaN(n)); if (ids.length > 0) nextId = Math.max(...ids) + 1;
    const fileName = `set_${nextId}.json`; const data = generateSetData(pawns, power, maxPower, { displayName, description }); data.setName = fileName.replace('.json', ''); fs.writeFileSync(path.join(SETS_DIR, fileName), JSON.stringify(data, null, 2)); res.json({ message: 'Set generated', name: data.setName });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});
app.post('/api/sets/save/:setName', (req, res) => {
  try {
    let { setsData } = req.body; const { setName } = req.params; const setPath = path.join(SETS_DIR, `${setName}.json`); if (!fs.existsSync(setPath)) return res.status(404).json({ error: 'Set not found' });
    const removeEmpty = (pile) => { if (!pile) return []; return pile.filter(s => Object.values(s.content || {}).reduce((a, b) => a + b, 0) > 0); };
    setsData.drawPile = removeEmpty(setsData.drawPile); setsData.heldSets = removeEmpty(setsData.heldSets); setsData.discardPile = removeEmpty(setsData.discardPile);
    fs.writeFileSync(setPath, JSON.stringify(setsData, null, 2)); res.json({ message: 'Set saved and cleaned successfully' });
  } catch (_err) { res.status(500).json({ error: 'Failed to save set' }); }
});
app.post('/api/sets/sort/:setName', (req, res) => {
  try { const { setName } = req.params; const data = loadSetFile(setName); if (!data) return res.status(404).json({ error: 'Set not found' }); const sorted = sortSetsData(data); fs.writeFileSync(path.join(SETS_DIR, `${setName}.json`), JSON.stringify(sorted, null, 2)); res.json({ message: 'Set sorted successfully', setsData: sorted }); }
  catch (_err) { res.status(500).json({ error: 'Failed to sort set' }); }
});
app.post('/api/sets/default/:setName', (req, res) => {
  try { const { setName } = req.params; const sourcePath = path.join(SETS_DIR, `${setName}.json`); const destPath = path.join(CONFIGS_DIR, 'set_default.json'); if (!fs.existsSync(sourcePath)) return res.status(404).json({ error: 'Source set not found' }); fs.copyFileSync(sourcePath, destPath); res.json({ message: `Set ${setName} is now the default for new games.` }); }
  catch (_err) { res.status(500).json({ error: 'Failed to set default' }); }
});
app.get('/api/map/:gameId', (req, res) => { try { res.json(getGameData(req.params.gameId).data); } catch (_err) { res.status(500).json({ error: 'Failed' }); } });
app.post('/api/map/:gameId', (req, res) => { try { saveFullState(req.params.gameId, req.body); io.to(`game:${req.params.gameId}`).emit('boardUpdate', req.body); res.json({ message: 'Saved' }); } catch (_err) { res.status(500).json({ error: 'Failed' }); } });
app.delete('/api/map/:gameId', (req, res) => { try { const gamePath = ensureGameDir(req.params.gameId); fs.rmSync(gamePath, { recursive: true, force: true }); res.json({ message: 'Deleted' }); } catch (_err) { res.status(500).json({ error: 'Failed' }); } });
app.delete('/api/games', (_req, res) => { try { if (fs.existsSync(GAMES_DIR)) { fs.rmSync(GAMES_DIR, { recursive: true, force: true }); } fs.mkdirSync(GAMES_DIR); res.json({ message: 'All games deleted' }); } catch (_err) { res.status(500).json({ error: 'Failed' }); } });
app.post('/api/init/:gameId', (req, res) => {
  const { gameId } = req.params; const { set } = req.query;
  try {
    const regions = createEmptyRegions(); const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS)); const config = getGlobalConfig(); 
    let requestedSet = set; if (!requestedSet && fs.existsSync(path.join(CONFIGS_DIR, 'set_default.json'))) requestedSet = 'set_default'; if (!requestedSet) requestedSet = config.defaultSetName;
    let setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData(INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, 6);
    if (setsData.items && !setsData.drawPile) { setsData.drawPile = setsData.items; delete setsData.items; }
    if (!setsData.discardPile) setsData.discardPile = []; if (!setsData.heldSets) setsData.heldSets = [];
    const setName = setsData.setName || 'generated'; const playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    players.forEach(p => {
      for (let i = 0; i < 5; i++) { if (setsData.drawPile.length === 0) break; const s = setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0]; s.ownerId = p.id; setsData.heldSets.push(s); }
    });
    const finalState = { regions, players, sets: setsData, phase: 'setup', currentRound: 1, currentPlayerIndex: 0, playerOrder, passedPlayers: [], availableGenerals: [...RACES], setName, history: [{time: new Date().toLocaleTimeString(), text: "Game started."}], gameStatus: 'active', jakubAngerIncreased: false, jakubTurnExecuted: false };
    saveFullState(gameId, finalState); io.to(`game:${gameId}`).emit('boardUpdate', finalState); res.json({ message: 'Initialized', state: finalState });
  } catch (_err) { res.status(500).json({ error: 'Failed' }); }
});
app.post('/api/simulate/:gameId', (req, res) => {
  const { set } = req.query;
  try {
    const regions = createEmptyRegions(); const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS)); const config = getGlobalConfig(); 
    let requestedSet = set; if (!requestedSet && fs.existsSync(path.join(CONFIGS_DIR, 'set_default.json'))) requestedSet = 'set_default'; if (!requestedSet) requestedSet = config.defaultSetName;
    let setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData(INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, 6);
    if (setsData.items && !setsData.drawPile) { setsData.drawPile = setsData.items; delete setsData.items; }
    if (!setsData.discardPile) setsData.discardPile = []; if (!setsData.heldSets) setsData.heldSets = [];
    let playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const drawSet = () => { if (setsData.drawPile.length === 0) { if (setsData.discardPile.length === 0) return null; setsData.drawPile = [...setsData.discardPile]; setsData.discardPile = []; } return setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0]; };
    players.forEach(p => { for (let i = 0; i < 5; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });
    const analytics = {
      vampire: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
      werewolf: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
      ghost: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
      bardak: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 }
    };
    for (let round = 1; round <= 8; round++) {
      players.forEach(p => { const myHeld = setsData.heldSets.filter(s => s.ownerId === p.id); const needed = 5 - myHeld.length; for (let i = 0; i < needed; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });
      for (let i = 0; i < 2; i++) { const s = drawSet(); if (s) { s.ownerId = 'jakub'; setsData.heldSets.push(s); } }
      let availableGenerals = [...RACES].sort(() => Math.random() - 0.5);
      playerOrder.forEach(id => { const p = players.find(x => x.id === id); p.generalOf = availableGenerals.pop(); });
      let passed = new Set();
      while (passed.size < players.length) {
        for (const id of playerOrder) {
          if (passed.has(id)) continue;
          const p = players.find(x => x.id === id); const jakRIdx = regions.findIndex(r => r.pawns.jakub?.length > 0); const jakubRegion = regions[jakRIdx];
          const myHeld = setsData.heldSets.filter(s => s.ownerId === p.id); const emptyR = regions.filter(r => !RACES.some(race => r.pawns[race]?.length > 0));
          const onBoard = {}; RACES.forEach(r => onBoard[r] = 0);
          regions.forEach(r => Object.entries(r.pawns).forEach(([tid, insts]) => { if (onBoard[tid] !== undefined) onBoard[tid] += insts.length; }));
          const pool = { ...setsData.pawns }; RACES.forEach(r => pool[r] -= onBoard[r]);
          let best = null;
          myHeld.forEach(s => {
            let can = true; Object.entries(s.content).forEach(([tid, count]) => { if (pool[tid] < count) can = false; });
            if (!can) return;
            emptyR.forEach(r => { const pts = calculateSetPlacementPoints(p.generalOf, s.content, r, jakubRegion, regions); if (!best || pts > best.pts) best = { s, r, pts }; });
          });
          if (best && best.pts > 1) { 
            const currentJakR = regions.find(reg => reg.pawns.jakub?.length > 0);
            players.forEach(beneficiary => { if (beneficiary.generalOf) { beneficiary.points += calculateSetPlacementPoints(beneficiary.generalOf, best.s.content, best.r, currentJakR, regions); } });
            Object.entries(best.s.content).forEach(([tid, count]) => { if (!best.r.pawns[tid]) best.r.pawns[tid] = []; for (let i = 0; i < count; i++) best.r.pawns[tid].push({ statuses: ['ENABLED'] }); }); 
            const idx = setsData.heldSets.findIndex(x => x.id === best.s.id); const used = setsData.heldSets.splice(idx, 1)[0]; used.ownerId = null; setsData.discardPile.push(used); 
          } else {
            if (myHeld.length > 3) { const excess = myHeld.length - 3; const sorted = [...myHeld].sort((a,b) => (a.content[p.generalOf]||0) - (b.content[p.generalOf]||0)); for(let i=0; i<excess; i++) { const s = sorted[i]; s.ownerId = 'jakub'; } p.points += excess; }
            passed.add(id);
          }
        }
      }
      let jakR = regions.find(r => r.pawns.jakub?.length > 0); let jakub = jakR.pawns.jakub[0];
      const jakubSets = setsData.heldSets.filter(s => s.ownerId === 'jakub');
      jakubSets.forEach(s => { 
        Object.entries(s.content).forEach(([race, count]) => { jakub.anger[race] += count; });
        let bonusRange = 0; RACES.forEach(race => { if (jakub.anger[race] > 10) bonusRange += 1; });
        jakub.range = 1 + bonusRange;
      });
      let continues = true;
      while (continues) {
        continues = false; let curR = regions.find(r => r.pawns.jakub?.length > 0);
        const sortedAngerRaces = RACES.map(r => ({ race: r, val: jakub.anger[r] })).filter(a => a.val > 0).sort((a,b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race)).map(a => a.race);
        if (sortedAngerRaces.length === 0) break;
        let actionFound = false;
        for (const race of sortedAngerRaces) {
          const units = curR.pawns[race]?.length || 0;
          if (units > 0) { const killCount = Math.min(units, jakub.anger[race]); const p = players.find(x => x.generalOf === race); if (p) p.points = Math.max(0, p.points - killCount); analytics[race].killed += killCount; jakub.anger[race] -= killCount; curR.pawns[race].splice(0, killCount); if (curR.pawns[race].length === 0) delete curR.pawns[race]; continues = true; actionFound = true; break; }
        }
        if (actionFound) continue;
        const candidates = getRegionsInRange(regions, curR.id, jakub.range); const bestRIdx = getBestTargetRegion(candidates, sortedAngerRaces, regions);
        if (bestRIdx !== null) { regions[bestRIdx].pawns.jakub = curR.pawns.jakub; delete curR.pawns.jakub; continues = true; }
      }
      let jakR_after = regions.find(r => r.pawns.jakub?.length > 0);
      if (jakR_after) {
        RACES.forEach(race => {
          const count = jakR_after.pawns[race]?.length || 0;
          if (count > 0) { const pts = count * 2; const p = players.find(x => x.generalOf === race); if (p) { p.points += pts; analytics[race].ramboPoints += pts; } }
        });
      }
      jakub.range = 1;
      jakubSets.forEach(s => { const idx = setsData.heldSets.findIndex(x => x.id === s.id); const recycled = setsData.heldSets.splice(idx, 1)[0]; recycled.ownerId = null; recycled.used = false; setsData.discardPile.push(recycled); });
      if (round === 1) { players.forEach(p => { if (p.generalOf) analytics[p.generalOf].afterR1 = p.points; }); }
      if (round < 8) { players.forEach(p => p.generalOf = null); playerOrder = [...players].sort((a,b) => a.points - b.points).map(p => p.id); }
    }
    players.forEach(p => {
      const pick = p.generalOf; if (!pick) return;
      let addedPoints = 0;
      if (pick === 'vampire') { let count = 0; regions.forEach(r => count += (r.pawns[pick]?.length || 0)); addedPoints = count * 2; }
      else if (pick === 'werewolf') { let count = 0; regions.forEach(r => count += (r.pawns[pick]?.length || 0)); addedPoints = count; }
      else if (pick === 'ghost') {
        regions.forEach(r => {
          const myCount = r.pawns[pick]?.length || 0;
          if (myCount > 0) {
            let others = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0);
            if (others.reduce((a,b)=>a+b,0) === 0) addedPoints += 2; else if (myCount > Math.max(...others)) addedPoints += 1;
          }
        });
      } else if (pick === 'bardak') {
        regions.forEach(r => {
          const myCount = r.pawns[pick]?.length || 0; if (myCount > 0) { let othersCounts = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0); const maxOther = Math.max(...othersCounts); if (myCount > maxOther) addedPoints += 1; }
        });
      }
      p.points += addedPoints; analytics[pick].finalBonus = addedPoints; analytics[pick].total = p.points;
    });
    res.json({ analytics });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Simulation failed' }); }
});

app.use((err, req, res, next) => { console.error("SERVER ERROR:", err); res.status(500).json({ error: "Internal Server Error" }); });

// Catch-all route for React Router
app.get('*path', (req, res) => {
  const indexPath = path.join(process.cwd(), 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built');
  }
});

io.on('connection', (socket) => { socket.to(`game:${socket.handshake.query.gameId}`).emit('userJoined', socket.id); socket.on('joinGame', id => socket.join(`game:${id}`)); });
server.listen(PORT, () => console.log(`Server running on ${PORT}`));

const getRegionsInRange = (regions, startIndex, range) => {
  const inRange = new Set(); const queue = [{ index: startIndex, dist: 0 }]; const visited = new Set([startIndex]);
  while (queue.length > 0) {
    const { index, dist } = queue.shift(); if (index !== startIndex) inRange.add(index);
    if (dist < range) { regions[index].neighbors.forEach(nIdx => { if (!visited.has(nIdx)) { visited.add(nIdx); queue.push({ index: nIdx, dist: dist + 1 }); } }); }
  }
  return Array.from(inRange);
};

const getBestTargetRegion = (candidateIndices, priorityRaces, regions) => {
  if (candidateIndices.length === 0) return null; let tied = candidateIndices;
  for (const race of priorityRaces) {
    let maxCount = -1; let nextTied = [];
    tied.forEach(rIdx => { const count = regions[rIdx].pawns[race]?.length || 0; if (count > maxCount) { maxCount = count; nextTied = [rIdx]; } else if (count === maxCount) { nextTied.push(rIdx); } });
    if (maxCount > 0) tied = nextTied; if (tied.length === 1) break;
  }
  const finalId = tied[0]; return priorityRaces.some(race => regions[finalId].pawns[race]?.length > 0) ? finalId : null;
};
