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

const INITIAL_BOARD = Array(25).fill(null).map(() => ({}));

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
    const currentCount = board[regionIndex][pawn] || 0;
    board[regionIndex][pawn] = currentCount + 1;
    
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
    const currentCount = board[regionIndex][pawn] || 0;
    
    if (currentCount > 0) {
      if (currentCount === 1) {
        delete board[regionIndex][pawn];
      } else {
        board[regionIndex][pawn] = currentCount - 1;
      }
      
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
  if (!Array.isArray(newBoard) || newBoard.length !== 25) {
    return res.status(400).json({ error: 'Invalid board format. Expected array of 25 regions.' });
  }
  
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
