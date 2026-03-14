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
const CONFIG_FILE = path.join(__dirname, 'server_config.json');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "DELETE"] }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

if (!fs.existsSync(GAMES_DIR)) fs.mkdirSync(GAMES_DIR);
if (!fs.existsSync(SETS_DIR)) fs.mkdirSync(SETS_DIR);

const getGlobalConfig = () => {
  if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const defaultConfig = { defaultSetName: null };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  return defaultConfig;
};

const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];
const DEFAULT_PLAYERS = [
  { id: 1, name: '1', points: 30, generalOf: null },
  { id: 2, name: '2', points: 30, generalOf: null },
  { id: 3, name: '3', points: 30, generalOf: null },
  { id: 4, name: '4', points: 30, generalOf: null }
];

const ensureGameDir = (gameId) => {
  const pathDir = path.join(GAMES_DIR, String(gameId));
  if (!fs.existsSync(pathDir)) fs.mkdirSync(pathDir, { recursive: true });
  return pathDir;
};

const loadSetFile = (setName) => {
  const setPath = path.join(SETS_DIR, `${setName}.json`);
  if (fs.existsSync(setPath)) return JSON.parse(fs.readFileSync(setPath, 'utf8'));
  return null;
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

const createEmptyRegions = () => {
  const size = 5;
  const regions = [];
  for (let i = 0; i < size * size; i++) {
    regions.push({ id: i, x: i % size, y: Math.floor(i / size), neighbors: [], pawns: {} });
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
  
  let gameState;
  if (fs.existsSync(statePath)) {
    gameState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } else {
    gameState = { 
      phase: 'setup', currentRound: 1, currentPlayerIndex: 0, 
      playerOrder: [1, 2, 3, 4], passedPlayers: [], availableGenerals: [...RACES], 
      setName: 'default', gameStatus: 'active' 
    };
  }

  let sets;
  if (fs.existsSync(setsPath)) {
    sets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
  } else {
    const config = getGlobalConfig();
    sets = (config.defaultSetName ? loadSetFile(config.defaultSetName) : null) || generateSetData({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 }, 6);
  }

  return { data: { regions, players, sets, history, ...gameState } };
};

const broadcastUpdate = (gameId, data) => { io.to(`game:${gameId}`).emit('boardUpdate', data); };

const saveFullState = (gameId, data) => {
  const gamePath = ensureGameDir(gameId);
  if (data.regions) fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(data.regions, null, 2));
  if (data.players) fs.writeFileSync(path.join(gamePath, 'players.json'), JSON.stringify(data.players, null, 2));
  if (data.sets) fs.writeFileSync(path.join(gamePath, 'sets.json'), JSON.stringify(data.sets, null, 2));
  if (data.history) fs.writeFileSync(path.join(gamePath, 'history.json'), JSON.stringify(data.history, null, 2));
  
  const meta = {};
  const keys = ['phase', 'currentRound', 'currentPlayerIndex', 'playerOrder', 'passedPlayers', 'availableGenerals', 'setName', 'gameStatus', 'jakubAngerIncreased', 'jakubTurnExecuted'];
  keys.forEach(k => { if (data[k] !== undefined) meta[k] = data[k]; });
  
  if (Object.keys(meta).length > 0) {
    const sp = path.join(gamePath, 'state.json');
    const existing = fs.existsSync(sp) ? JSON.parse(fs.readFileSync(sp, 'utf8')) : {};
    fs.writeFileSync(sp, JSON.stringify({ ...existing, ...meta }, null, 2));
  }
};

app.get('/api/config', (req, res) => res.json(getGlobalConfig()));
app.post('/api/config', (req, res) => {
  const config = getGlobalConfig();
  if (req.body.defaultSetName !== undefined) config.defaultSetName = req.body.defaultSetName;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  res.json(config);
});

app.get('/api/sets', (req, res) => {
  try {
    const files = fs.readdirSync(SETS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    res.json(files);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/sets/details/:setName', (req, res) => {
  try {
    const data = loadSetFile(req.params.setName);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/map/:gameId', (req, res) => {
  try { res.json(getGameData(req.params.gameId).data); } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/map/:gameId', (req, res) => {
  try { saveFullState(req.params.gameId, req.body); broadcastUpdate(req.params.gameId, req.body); res.json({ message: 'Saved' }); }
  catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/map/:gameId', (req, res) => {
  try {
    const gamePath = ensureGameDir(req.params.gameId);
    fs.rmSync(gamePath, { recursive: true, force: true });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/init/:gameId', (req, res) => {
  const { gameId } = req.params;
  const { set } = req.query;
  try {
    const regions = createEmptyRegions();
    const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
    const config = getGlobalConfig();
    const requestedSet = set || config.defaultSetName;
    let setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 }, 6);
    const setName = requestedSet || 'generated';

    const playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const history = [
      { time: new Date().toLocaleTimeString(), text: `Game ${gameId} started with set: ${setName}` },
      { time: new Date().toLocaleTimeString(), text: `Initial Player Order: ${playerOrder.join(' -> ')}` }
    ];

    const finalState = { 
      regions, players, sets: setsData, phase: 'setup', currentRound: 1, 
      currentPlayerIndex: 0, playerOrder, passedPlayers: [], 
      availableGenerals: [...RACES], setName, history, gameStatus: 'active',
      jakubAngerIncreased: false, jakubTurnExecuted: false 
    };
    saveFullState(gameId, finalState);
    broadcastUpdate(gameId, finalState);
    res.json({ message: 'Initialized', state: finalState });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.use((err, req, res, next) => { console.error("SERVER ERROR:", err); res.status(500).json({ error: "Internal Server Error" }); });
io.on('connection', (socket) => { socket.on('joinGame', id => socket.join(`game:${id}`)); });
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
