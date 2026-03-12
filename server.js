import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GAMES_DIR = path.join(__dirname, 'games');
const SETS_DIR = path.join(__dirname, 'sets');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "DELETE"] }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

if (!fs.existsSync(GAMES_DIR)) fs.mkdirSync(GAMES_DIR);
if (!fs.existsSync(SETS_DIR)) fs.mkdirSync(SETS_DIR);

const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];
const DEFAULT_PLAYERS = [
  { id: 1, name: '1', points: 10, generalOf: null },
  { id: 2, name: '2', points: 10, generalOf: null },
  { id: 3, name: '3', points: 10, generalOf: null },
  { id: 4, name: '4', points: 10, generalOf: null }
];

const getManhattanDistance = (r1, r2) => Math.abs(r1.x - r2.x) + Math.abs(r1.y - r2.y);

const calculateSetPlacementPoints = (race, setContent, targetRegion, jakubRegion) => {
  const dist = jakubRegion ? getManhattanDistance(targetRegion, jakubRegion) : 999;
  const ownPawnsInSet = setContent[race] || 0;
  if (race === 'vampire') return ownPawnsInSet + (2 - dist);
  if (race === 'werewolf') return (dist <= 2) ? (ownPawnsInSet + 1) : 0;
  if (race === 'bardak') return Object.values(setContent).reduce((a, b) => a + b, 0);
  if (race === 'ghost') return ownPawnsInSet + (dist <= 2 ? -1 : 1);
  return 0;
};

const createEmptyRegions = () => {
  const size = 5;
  const regions = [];
  for (let i = 0; i < size * size; i++) {
    const x = i % size; const y = Math.floor(i / size);
    regions.push({ id: i, x, y, neighbors: [], pawns: {} });
  }
  regions.forEach(region => {
    const { x, y } = region;
    if (y > 0) region.neighbors.push((y - 1) * size + x);
    if (y < size - 1) region.neighbors.push((y + 1) * size + x);
    if (x > 0) region.neighbors.push(y * size + (x - 1));
    if (x < size - 1) region.neighbors.push(y * size + (x + 1));
  });
  const interior = regions.filter(r => r.x > 0 && r.x < 4 && r.y > 0 && r.y < 4).map(r => r.id);
  const rIdx = interior[Math.floor(Math.random() * interior.length)];
  regions[rIdx].pawns.jakub = [{ statuses: ['ENABLED'], speed: 1, range: 1, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }];
  return regions;
};

const generateSetData = (pawnsConfig, powerConfig, maxPower, meta = {}) => {
  const totals = { ...pawnsConfig };
  const items = [];
  let setId = 1;
  const getAvailable = () => Object.keys(totals).filter(t => totals[t] > 0);
  while (getAvailable().length > 0) {
    const available = getAvailable();
    const selected = [...available].sort(() => Math.random() - 0.5).slice(0, 3);
    const content = {};
    let curPwr = 0; let curCnt = 0;
    selected.forEach(t => {
      if (totals[t] > 0 && curPwr + powerConfig[t] <= maxPower && curCnt + 1 <= 5) {
        content[t] = 1; totals[t]--; curPwr += powerConfig[t]; curCnt++;
      }
    });
    let improved = true;
    while (improved && curPwr < maxPower && curCnt < 5) {
      improved = false;
      for (const t of selected) {
        if (totals[t] > 0 && curPwr + powerConfig[t] <= maxPower && curCnt + 1 <= 5) {
          content[t] = (content[t] || 0) + 1; totals[t]--; curPwr += powerConfig[t]; curCnt++;
          improved = true; break;
        }
      }
    }
    if (curCnt > 0) items.push({ id: setId++, content, used: false, power: curPwr, ownerId: null });
    else break;
  }
  return { pawns: pawnsConfig, power: powerConfig, items, maxPower, ...meta };
};

const ensureGameDir = (gameId) => {
  const pathDir = path.join(GAMES_DIR, gameId);
  if (!fs.existsSync(pathDir)) fs.mkdirSync(pathDir, { recursive: true });
  return pathDir;
};

const getGameData = (gameId) => {
  const gamePath = ensureGameDir(gameId);
  const mapPath = path.join(gamePath, 'map.json');
  const playersPath = path.join(gamePath, 'players.json');
  const setsPath = path.join(gamePath, 'sets.json');
  const statePath = path.join(gamePath, 'state.json');

  let regions = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, 'utf8')) : createEmptyRegions();
  let players = fs.existsSync(playersPath) ? JSON.parse(fs.readFileSync(playersPath, 'utf8')) : DEFAULT_PLAYERS;
  let gameState = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { phase: 'setup', availableGenerals: [...RACES], setName: 'default' };
  
  let sets;
  if (fs.existsSync(setsPath)) {
    sets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
  } else {
    const available = fs.readdirSync(SETS_DIR).filter(f => f.endsWith('.json'));
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      sets = JSON.parse(fs.readFileSync(path.join(SETS_DIR, pick), 'utf8'));
      gameState.setName = pick.replace('.json', '');
    } else {
      sets = generateSetData({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 }, 6);
    }
  }

  if (!fs.existsSync(mapPath)) fs.writeFileSync(mapPath, JSON.stringify(regions, null, 2));
  if (!fs.existsSync(playersPath)) fs.writeFileSync(playersPath, JSON.stringify(players, null, 2));
  if (!fs.existsSync(setsPath)) fs.writeFileSync(setsPath, JSON.stringify(sets, null, 2));
  if (!fs.existsSync(statePath)) fs.writeFileSync(statePath, JSON.stringify(gameState, null, 2));

  return { data: { regions, players, sets, ...gameState } };
};

const broadcastUpdate = (gameId, data) => { io.to(`game:${gameId}`).emit('boardUpdate', data); };

const saveFullState = (gameId, data) => {
  const gamePath = ensureGameDir(gameId);
  if (data.regions) fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(data.regions, null, 2));
  if (data.players) fs.writeFileSync(path.join(gamePath, 'players.json'), JSON.stringify(data.players, null, 2));
  if (data.sets) fs.writeFileSync(path.join(gamePath, 'sets.json'), JSON.stringify(data.sets, null, 2));
  const meta = {};
  if (data.phase) meta.phase = data.phase;
  if (data.availableGenerals) meta.availableGenerals = data.availableGenerals;
  if (data.setName) meta.setName = data.setName;
  if (Object.keys(meta).length > 0) {
    const sp = path.join(gamePath, 'state.json');
    const existing = fs.existsSync(sp) ? JSON.parse(fs.readFileSync(sp, 'utf8')) : {};
    fs.writeFileSync(sp, JSON.stringify({ ...existing, ...meta }, null, 2));
  }
};

// --- API Endpoints ---

app.get('/api/sets', (req, res) => {
  try {
    const files = fs.readdirSync(SETS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    res.json(files);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/sets/generate', (req, res) => {
  try {
    const { pawns, power, maxPower, displayName, description } = req.body;
    
    // Find next free ID: set_1, set_2...
    const files = fs.readdirSync(SETS_DIR).filter(f => f.startsWith('set_') && f.endsWith('.json'));
    let nextId = 1;
    const ids = files.map(f => parseInt(f.replace('set_', '').replace('.json', ''))).filter(n => !isNaN(n));
    if (ids.length > 0) nextId = Math.max(...ids) + 1;
    
    const fileName = `set_${nextId}.json`;
    const data = generateSetData(pawns, power, maxPower, { displayName, description });
    
    fs.writeFileSync(path.join(SETS_DIR, fileName), JSON.stringify(data, null, 2));
    res.json({ message: 'Set generated', name: fileName.replace('.json', '') });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/map/:gameId', (req, res) => {
  const { gameId } = req.params;
  try { res.json(getGameData(gameId).data); } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/init/:gameId', (req, res) => {
  const { gameId } = req.params;
  const { set } = req.query;
  try {
    const regions = createEmptyRegions();
    const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
    const jakubRegion = regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    
    let sets;
    let setName = 'random';
    if (set && fs.existsSync(path.join(SETS_DIR, `${set}.json`))) {
      sets = JSON.parse(fs.readFileSync(path.join(SETS_DIR, `${set}.json`), 'utf8'));
      setName = set;
    } else {
      const available = fs.readdirSync(SETS_DIR).filter(f => f.endsWith('.json'));
      if (available.length > 0) {
        const pick = available[Math.floor(Math.random() * available.length)];
        sets = JSON.parse(fs.readFileSync(path.join(SETS_DIR, pick), 'utf8'));
        setName = pick.replace('.json', '');
      } else {
        sets = generateSetData({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 }, 6);
      }
    }

    const shuffledRaces = [...RACES].sort(() => Math.random() - 0.5);
    players.forEach((p, i) => { p.generalOf = shuffledRaces[i]; });

    const globalSets = sets.items.filter(s => s.ownerId === null && !s.used);
    players.forEach(p => {
      for (let i = 0; i < 5; i++) {
        if (globalSets.length === 0) break;
        const sIdx = Math.floor(Math.random() * globalSets.length);
        const s = globalSets.splice(sIdx, 1)[0];
        s.ownerId = p.id;
      }
    });

    const passedPlayers = new Set();
    while (passedPlayers.size < players.length) {
      const actives = players.filter(p => !passedPlayers.has(p.id));
      if (actives.length === 0) break;
      const cur = actives.sort((a, b) => a.points - b.points || a.id - b.id)[0];
      const mySets = sets.items.filter(s => s.ownerId === cur.id && !s.used);
      const emptyR = regions.filter(r => !RACES.some(race => r.pawns[race]?.length > 0));
      if (mySets.length === 0 || emptyR.length === 0) { passedPlayers.add(cur.id); continue; }
      let best = null;
      mySets.forEach(s => {
        emptyR.forEach(r => {
          const pts = calculateSetPlacementPoints(cur.generalOf, s.content, r, jakubRegion);
          if (!best || pts > best.pts) best = { s, r, pts };
        });
      });
      if (best && !(best.pts <= 0 && mySets.length <= 2)) {
        Object.entries(best.s.content).forEach(([tId, count]) => {
          if (!best.r.pawns[tId]) best.r.pawns[tId] = [];
          for (let i = 0; i < count; i++) best.r.pawns[tId].push({ statuses: ['ENABLED'] });
        });
        cur.points += best.pts;
        best.s.used = true; best.s.ownerId = null;
      } else passedPlayers.add(cur.id);
    }

    const finalState = { regions, players, sets, phase: 'setup', availableGenerals: [], setName };
    saveFullState(gameId, finalState);
    broadcastUpdate(gameId, finalState);
    res.json({ message: `Game initialized with set: ${setName}`, state: finalState });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/map/:gameId', (req, res) => {
  try { saveFullState(req.params.gameId, req.body); broadcastUpdate(req.params.gameId, req.body); res.json({ message: 'Saved' }); }
  catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/map/:gameId', (req, res) => {
  try {
    const emptyR = createEmptyRegions(); const newS = generateSetData({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 }, 6);
    const state = { phase: 'setup', availableGenerals: [...RACES], regions: emptyR, players: DEFAULT_PLAYERS, sets: newS, setName: 'generated' };
    saveFullState(req.params.gameId, state); broadcastUpdate(req.params.gameId, state); res.json(state);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

io.on('connection', (socket) => { socket.on('joinGame', id => socket.join(`game:${id}`)); });
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
