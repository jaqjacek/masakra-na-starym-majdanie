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
    regions.push({ id: i, x: i % size, y: Math.floor(i / size), neighbors: [], pawns: {} });
  }
  regions.forEach(region => {
    const { x, y } = region;
    if (y > 0) region.neighbors.push((y - 1) * size + x);
    if (y < size - 1) region.neighbors.push((y + 1) * size + x);
    if (x > 0) region.neighbors.push(y * size + (x - 1));
    if (x < size - 1) region.neighbors.push(y * size + (x + 1));
  });
  return regions;
};

const DEFAULT_PLAYERS = [
  { id: 1, name: '1', points: 10 },
  { id: 2, name: '2', points: 10 },
  { id: 3, name: '3', points: 10 },
  { id: 4, name: '4', points: 10 }
];

const DEFAULT_PAWNS_CONFIG = { bardak: 80, ghost: 30, werewolf: 20, vampire: 10 };
const DEFAULT_POWER_CONFIG = { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 };
const MAX_SET_POWER = 6;
const MAX_SET_COUNT = 5;
const MAX_SET_TYPES = 3;

const generateSets = (pawnsConfig = DEFAULT_PAWNS_CONFIG, powerConfig = DEFAULT_POWER_CONFIG) => {
  const totals = { ...pawnsConfig };
  const items = [];
  let setId = 1;
  const getAvailableTypes = () => Object.keys(totals).filter(t => totals[t] > 0);
  
  while (getAvailableTypes().length > 0) {
    const availableTypes = getAvailableTypes();
    const numTypesToTry = Math.min(availableTypes.length, MAX_SET_TYPES);
    const selectedTypes = [...availableTypes].sort(() => Math.random() - 0.5).slice(0, numTypesToTry);

    const setContent = {};
    let currentPower = 0;
    let currentCount = 0;

    selectedTypes.forEach(type => {
      const pwr = powerConfig[type];
      if (totals[type] > 0 && currentPower + pwr <= MAX_SET_POWER && currentCount + 1 <= MAX_SET_COUNT) {
        setContent[type] = (setContent[type] || 0) + 1;
        totals[type]--;
        currentPower += pwr;
        currentCount++;
      }
    });

    let improved = true;
    while (improved && currentPower < MAX_SET_POWER && currentCount < MAX_SET_COUNT) {
      improved = false;
      const shuffledSelected = [...selectedTypes].sort(() => Math.random() - 0.5);
      for (const type of shuffledSelected) {
        const pwr = powerConfig[type];
        if (totals[type] > 0 && currentPower + pwr <= MAX_SET_POWER && currentCount + 1 <= MAX_SET_COUNT) {
          setContent[type] = (setContent[type] || 0) + 1;
          totals[type]--;
          currentPower += pwr;
          currentCount++;
          improved = true;
          break; 
        }
      }
    }

    if (currentCount > 0) {
      items.push({ id: setId++, content: setContent, used: false, power: currentPower, ownerId: null });
    } else break;
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
  
  let regions = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, 'utf8')) : createEmptyRegions();
  let players = fs.existsSync(playersPath) ? JSON.parse(fs.readFileSync(playersPath, 'utf8')) : DEFAULT_PLAYERS;
  
  let setsData;
  if (fs.existsSync(setsPath)) {
    const raw = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
    if (Array.isArray(raw) || !raw.power || !raw.items) {
      setsData = generateSets();
      fs.writeFileSync(setsPath, JSON.stringify(setsData, null, 2));
    } else {
      // Ensure ownerId exists on items
      raw.items.forEach(item => { if (item.ownerId === undefined) item.ownerId = null; });
      setsData = raw;
    }
  } else {
    setsData = generateSets();
    fs.writeFileSync(setsPath, JSON.stringify(setsData, null, 2));
  }

  return { data: { regions, players, sets: setsData } };
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
    broadcastUpdate(gameId, req.body);
    res.json({ message: 'Saved' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/map/:gameId', (req, res) => {
  const { gameId } = req.params;
  try {
    const gamePath = ensureGameDir(gameId);
    const emptyRegions = createEmptyRegions();
    const newSetsData = generateSets();
    fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(emptyRegions, null, 2));
    fs.writeFileSync(path.join(gamePath, 'players.json'), JSON.stringify(DEFAULT_PLAYERS, null, 2));
    fs.writeFileSync(path.join(gamePath, 'sets.json'), JSON.stringify(newSetsData, null, 2));
    const newState = { regions: emptyRegions, players: DEFAULT_PLAYERS, sets: newSetsData };
    broadcastUpdate(gameId, newState);
    res.json(newState);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

io.on('connection', (socket) => {
  socket.on('joinGame', (gameId) => { socket.join(`game:${gameId}`); });
});

server.listen(PORT, () => { console.log(`Server running on ${PORT}`); });
