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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE"]
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

if (!fs.existsSync(GAMES_DIR)) {
  fs.mkdirSync(GAMES_DIR);
}

const createEmptyRegions = () => {
  const size = 5;
  const regions = [];
  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    regions.push({ id: i, x, y, neighbors: [], pawns: {} });
  }
  regions.forEach(region => {
    const { x, y } = region;
    if (y > 0) region.neighbors.push((y - 1) * size + x);
    if (y < size - 1) region.neighbors.push((y + 1) * size + x);
    if (x > 0) region.neighbors.push(y * size + (x - 1));
    if (x < size - 1) region.neighbors.push(y * size + (x + 1));
  });

  // Randomly place Jakub in an interior region (x: 1-3, y: 1-3)
  const interiorIndices = regions
    .filter(r => r.x > 0 && r.x < 4 && r.y > 0 && r.y < 4)
    .map(r => r.id);
  const randomIdx = interiorIndices[Math.floor(Math.random() * interiorIndices.length)];
  
  regions[randomIdx].pawns.jakub = [{
    statuses: ['ENABLED'],
    speed: 1,
    range: 1,
    anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 }
  }];

  return regions;
};

const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];

const generateInitialPlayers = () => {
  return [
    { id: 1, name: '1', points: 10, generalOf: null },
    { id: 2, name: '2', points: 10, generalOf: null },
    { id: 3, name: '3', points: 10, generalOf: null },
    { id: 4, name: '4', points: 10, generalOf: null }
  ];
};

const DEFAULT_PAWNS_CONFIG = { bardak: 80, ghost: 30, werewolf: 20, vampire: 10 };
const DEFAULT_POWER_CONFIG = { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 };

const generateSets = (pawnsConfig = DEFAULT_PAWNS_CONFIG, powerConfig = DEFAULT_POWER_CONFIG) => {
  const totals = { ...pawnsConfig };
  const items = [];
  let setId = 1;
  const getAvailableTypes = () => Object.keys(totals).filter(t => totals[t] > 0);
  while (getAvailableTypes().length > 0) {
    const availableTypes = getAvailableTypes();
    const selectedTypes = [...availableTypes].sort(() => Math.random() - 0.5).slice(0, 3);
    const setContent = {};
    let currentPower = 0;
    let currentCount = 0;
    selectedTypes.forEach(type => {
      if (totals[type] > 0 && currentPower + powerConfig[type] <= 6 && currentCount + 1 <= 5) {
        setContent[type] = 1; totals[type]--; currentPower += powerConfig[type]; currentCount++;
      }
    });
    let improved = true;
    while (improved && currentPower < 6 && currentCount < 5) {
      improved = false;
      for (const type of selectedTypes) {
        if (totals[type] > 0 && currentPower + powerConfig[type] <= 6 && currentCount + 1 <= 5) {
          setContent[type] = (setContent[type] || 0) + 1; totals[type]--; currentPower += powerConfig[type]; currentCount++;
          improved = true; break; 
        }
      }
    }
    if (currentCount > 0) items.push({ id: setId++, content: setContent, used: false, power: currentPower, ownerId: null });
    else break;
  }
  return { pawns: pawnsConfig, power: powerConfig, items };
};

const ensureGameDir = (gameId) => {
  const gamePath = path.join(GAMES_DIR, gameId);
  if (!fs.existsSync(gamePath)) fs.mkdirSync(gamePath, { recursive: true });
  return gamePath;
};

const getGameData = (gameId) => {
  const gamePath = ensureGameDir(gameId);
  const mapPath = path.join(gamePath, 'map.json');
  const playersPath = path.join(gamePath, 'players.json');
  const setsPath = path.join(gamePath, 'sets.json');
  const statePath = path.join(gamePath, 'state.json');

  let regions;
  if (fs.existsSync(mapPath)) {
    regions = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  } else {
    regions = createEmptyRegions();
    fs.writeFileSync(mapPath, JSON.stringify(regions, null, 2), 'utf8');
  }

  let players;
  if (fs.existsSync(playersPath)) {
    players = JSON.parse(fs.readFileSync(playersPath, 'utf8'));
  } else {
    players = generateInitialPlayers();
    fs.writeFileSync(playersPath, JSON.stringify(players, null, 2), 'utf8');
  }

  let sets;
  if (fs.existsSync(setsPath)) {
    sets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
  } else {
    sets = generateSets();
    fs.writeFileSync(setsPath, JSON.stringify(sets, null, 2), 'utf8');
  }

  let gameState;
  if (fs.existsSync(statePath)) {
    gameState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } else {
    gameState = { phase: 'setup', availableGenerals: [...RACES] };
    fs.writeFileSync(statePath, JSON.stringify(gameState, null, 2), 'utf8');
  }

  return { data: { regions, players, sets, ...gameState } };
};

const broadcastUpdate = (gameId, data) => {
  io.to(`game:${gameId}`).emit('boardUpdate', data);
};

app.get('/api/map/:gameId', (req, res) => {
  const { gameId } = req.params;
  try { res.json(getGameData(gameId).data); } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/map/:gameId', (req, res) => {
  const { gameId } = req.params;
  try {
    const gamePath = ensureGameDir(gameId);
    if (req.body.regions) fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(req.body.regions, null, 2));
    if (req.body.players) fs.writeFileSync(path.join(gamePath, 'players.json'), JSON.stringify(req.body.players, null, 2));
    if (req.body.sets) fs.writeFileSync(path.join(gamePath, 'sets.json'), JSON.stringify(req.body.sets, null, 2));
    
    const metaState = {};
    if (req.body.phase) metaState.phase = req.body.phase;
    if (req.body.availableGenerals) metaState.availableGenerals = req.body.availableGenerals;
    
    if (Object.keys(metaState).length > 0) {
      const statePath = path.join(gamePath, 'state.json');
      const existing = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};
      fs.writeFileSync(statePath, JSON.stringify({ ...existing, ...metaState }, null, 2));
    }

    broadcastUpdate(gameId, req.body);
    res.json({ message: 'Saved' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/map/:gameId', (req, res) => {
  const { gameId } = req.params;
  try {
    const gamePath = ensureGameDir(gameId);
    const emptyRegions = createEmptyRegions();
    const newSets = generateSets();
    const newPlayers = generateInitialPlayers();
    const newState = { phase: 'setup', availableGenerals: [...RACES] };
    
    fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(emptyRegions, null, 2));
    fs.writeFileSync(path.join(gamePath, 'players.json'), JSON.stringify(newPlayers, null, 2));
    fs.writeFileSync(path.join(gamePath, 'sets.json'), JSON.stringify(newSets, null, 2));
    fs.writeFileSync(path.join(gamePath, 'state.json'), JSON.stringify(newState, null, 2));
    
    const fullState = { regions: emptyRegions, players: newPlayers, sets: newSets, ...newState };
    broadcastUpdate(gameId, fullState);
    res.json(fullState);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

io.on('connection', (socket) => {
  socket.on('joinGame', (gameId) => { socket.join(`game:${gameId}`); });
});

server.listen(PORT, () => { console.log(`Server running on ${PORT}`); });
