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

// Ensure games directory exists
if (!fs.existsSync(GAMES_DIR)) {
  fs.mkdirSync(GAMES_DIR);
}

// Helper to generate 5x5 board with neighbors
const createInitialBoard = () => {
  const size = 5;
  const regions = [];

  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    regions.push({
      id: i,
      x,
      y,
      neighbors: [],
      pawns: {} // container for pawn types: { typeId: [instances] }
    });
  }

  // Calculate neighbors for each region (orthogonal only: up, down, left, right)
  regions.forEach(region => {
    const { x, y } = region;
    // Top
    if (y > 0) region.neighbors.push((y - 1) * size + x);
    // Bottom
    if (y < size - 1) region.neighbors.push((y + 1) * size + x);
    // Left
    if (x > 0) region.neighbors.push(y * size + (x - 1));
    // Right
    if (x < size - 1) region.neighbors.push(y * size + (x + 1));
  });

  return regions;
};

const INITIAL_BOARD = createInitialBoard();

// Helper to get game file path and initialize if needed
const getGameData = (gameId) => {
  const gamePath = path.join(GAMES_DIR, gameId);
  if (!fs.existsSync(gamePath)) {
    fs.mkdirSync(gamePath, { recursive: true });
  }
  const filePath = path.join(gamePath, 'map.json');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(INITIAL_BOARD, null, 2), 'utf8');
  }
  return { filePath, board: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
};

// Function to broadcast board update to specific game room
const broadcastUpdate = (gameId, board) => {
  io.to(`game:${gameId}`).emit('boardUpdate', board);
};

// GET /api/map/:gameId/add?region=0&pawn=vampire
app.get('/api/map/:gameId/add', (req, res) => {
  const { gameId } = req.params;
  const { region, pawn } = req.query;
  const regionIndex = parseInt(region);
  
  if (isNaN(regionIndex) || regionIndex < 0 || regionIndex >= 25 || !pawn) {
    return res.status(400).json({ error: 'Invalid region index or pawn type.' });
  }

  try {
    const { filePath, board } = getGameData(gameId);
    if (!board[regionIndex].pawns[pawn]) board[regionIndex].pawns[pawn] = [];
    
    // In actual game logic we'd need to know which status to add, 
    // but for simple REST GET we use a default mock pawn
    board[regionIndex].pawns[pawn].push({ statuses: ['ENABLED'] });
    
    fs.writeFileSync(filePath, JSON.stringify(board, null, 2), 'utf8');
    broadcastUpdate(gameId, board);
    res.json({ message: `Added ${pawn} to region ${regionIndex} in game ${gameId}`, board });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update map.' });
  }
});

// GET /api/map/:gameId/remove?region=0&pawn=vampire
app.get('/api/map/:gameId/remove', (req, res) => {
  const { gameId } = req.params;
  const { region, pawn } = req.query;
  const regionIndex = parseInt(region);
  
  if (isNaN(regionIndex) || regionIndex < 0 || regionIndex >= 25 || !pawn) {
    return res.status(400).json({ error: 'Invalid region index or pawn type.' });
  }

  try {
    const { filePath, board } = getGameData(gameId);
    if (board[regionIndex].pawns[pawn] && board[regionIndex].pawns[pawn].length > 0) {
      board[regionIndex].pawns[pawn].pop();
      if (board[regionIndex].pawns[pawn].length === 0) delete board[regionIndex].pawns[pawn];
      
      fs.writeFileSync(filePath, JSON.stringify(board, null, 2), 'utf8');
      broadcastUpdate(gameId, board);
      res.json({ message: `Removed ${pawn} from region ${regionIndex} in game ${gameId}`, board });
    } else {
      res.status(400).json({ error: 'No pawns of this type in the specified region.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update map.' });
  }
});

// GET /api/map/:gameId - Fetch current board state
app.get('/api/map/:gameId', (req, res) => {
  const { gameId } = req.params;
  try {
    const { board } = getGameData(gameId);
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read map data.' });
  }
});

// POST /api/map/:gameId - Upload/Update board state
app.post('/api/map/:gameId', (req, res) => {
  const { gameId } = req.params;
  const newBoard = req.body;
  
  try {
    const { filePath } = getGameData(gameId);
    fs.writeFileSync(filePath, JSON.stringify(newBoard, null, 2), 'utf8');
    broadcastUpdate(gameId, newBoard);
    res.json({ message: 'Map updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save map data.' });
  }
});

// DELETE /api/map/:gameId - Reset board state
app.delete('/api/map/:gameId', (req, res) => {
  const { gameId } = req.params;
  try {
    const { filePath } = getGameData(gameId);
    fs.writeFileSync(filePath, JSON.stringify(INITIAL_BOARD, null, 2), 'utf8');
    broadcastUpdate(gameId, INITIAL_BOARD);
    res.json({ message: 'Map reset successfully.', board: INITIAL_BOARD });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset map data.' });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('joinGame', (gameId) => {
    socket.join(`game:${gameId}`);
    console.log(`Socket ${socket.id} joined game: ${gameId}`);
  });
});

server.listen(PORT, () => {
  console.log(`Multi-game Backend server running on http://localhost:${PORT}`);
});
