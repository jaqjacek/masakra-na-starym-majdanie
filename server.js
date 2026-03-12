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

const ensureGameDir = (gameId) => {
  const gamePath = path.join(GAMES_DIR, gameId);
  if (!fs.existsSync(gamePath)) {
    fs.mkdirSync(gamePath, { recursive: true });
  }
  return gamePath;
};

const getPlayersConfig = (gameId) => {
  const gamePath = ensureGameDir(gameId);
  const playersPath = path.join(gamePath, 'players.json');
  if (!fs.existsSync(playersPath)) {
    console.log(`Generating new players.json for game ${gameId}`);
    fs.writeFileSync(playersPath, JSON.stringify(DEFAULT_PLAYERS, null, 2), 'utf8');
    return DEFAULT_PLAYERS;
  }
  return JSON.parse(fs.readFileSync(playersPath, 'utf8'));
};

const getGameData = (gameId) => {
  const gamePath = ensureGameDir(gameId);
  const mapPath = path.join(gamePath, 'map.json');
  
  let regions;
  if (!fs.existsSync(mapPath)) {
    regions = createEmptyRegions();
    fs.writeFileSync(mapPath, JSON.stringify(regions, null, 2), 'utf8');
  } else {
    regions = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  }

  const players = getPlayersConfig(gameId);
  return { data: { regions, players } };
};

const broadcastUpdate = (gameId, data) => {
  io.to(`game:${gameId}`).emit('boardUpdate', data);
};

// GET /api/map/:gameId - Fetch current state (merged regions + players)
app.get('/api/map/:gameId', (req, res) => {
  const { gameId } = req.params;
  try {
    const { data } = getGameData(gameId);
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to read data' }); }
});

// POST /api/map/:gameId - Update state (regions and/or players)
app.post('/api/map/:gameId', (req, res) => {
  const { gameId } = req.params;
  try {
    const gamePath = ensureGameDir(gameId);
    
    if (req.body.regions) {
      fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(req.body.regions, null, 2), 'utf8');
    }
    
    if (req.body.players) {
      console.log(`Updating players.json for game ${gameId}`);
      fs.writeFileSync(path.join(gamePath, 'players.json'), JSON.stringify(req.body.players, null, 2), 'utf8');
    }
    
    broadcastUpdate(gameId, req.body);
    res.json({ message: 'Saved successfully' });
  } catch (err) { res.status(500).json({ error: 'Failed to save' }); }
});

// DELETE /api/map/:gameId - Reset state
app.delete('/api/map/:gameId', (req, res) => {
  const { gameId } = req.params;
  try {
    const gamePath = ensureGameDir(gameId);
    const emptyRegions = createEmptyRegions();
    
    fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(emptyRegions, null, 2), 'utf8');
    fs.writeFileSync(path.join(gamePath, 'players.json'), JSON.stringify(DEFAULT_PLAYERS, null, 2), 'utf8');
    
    const newState = { regions: emptyRegions, players: DEFAULT_PLAYERS };
    broadcastUpdate(gameId, newState);
    res.json({ message: 'Reset successfully', data: newState });
  } catch (err) { res.status(500).json({ error: 'Failed to reset' }); }
});

// Helper REST endpoints for simple add/remove
app.get('/api/map/:gameId/add', (req, res) => {
  const { gameId } = req.params;
  const { region, pawn } = req.query;
  try {
    const { data } = getGameData(gameId);
    const idx = parseInt(region);
    if (!data.regions[idx].pawns[pawn]) data.regions[idx].pawns[pawn] = [];
    data.regions[idx].pawns[pawn].push({ statuses: ['ENABLED'] });
    
    const gamePath = ensureGameDir(gameId);
    fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(data.regions, null, 2), 'utf8');
    
    broadcastUpdate(gameId, data);
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

app.get('/api/map/:gameId/remove', (req, res) => {
  const { gameId } = req.params;
  const { region, pawn } = req.query;
  try {
    const { data } = getGameData(gameId);
    const idx = parseInt(region);
    if (data.regions[idx].pawns[pawn] && data.regions[idx].pawns[pawn].length > 0) {
      data.regions[idx].pawns[idx].pop();
      if (data.regions[idx].pawns[idx].length === 0) delete data.regions[idx].pawns[pawn];
      
      const gamePath = ensureGameDir(gameId);
      fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(data.regions, null, 2), 'utf8');
      
      broadcastUpdate(gameId, data);
      res.json(data);
    } else { res.status(400).json({ error: 'Not found' }); }
  } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

io.on('connection', (socket) => {
  socket.on('joinGame', (gameId) => {
    socket.join(`game:${gameId}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
