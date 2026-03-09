import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAP_FILE = path.join(__dirname, 'map.json');

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

// Initialize map file if it doesn't exist
const INITIAL_BOARD = Array(25).fill(null).map(() => ({}));
if (!fs.existsSync(MAP_FILE)) {
  fs.writeFileSync(MAP_FILE, JSON.stringify(INITIAL_BOARD, null, 2), 'utf8');
}

// Function to broadcast board update
const broadcastUpdate = (board) => {
  io.emit('boardUpdate', board);
};

// GET /api/map - Fetch current board state
app.get('/api/map', (req, res) => {
  try {
    const data = fs.readFileSync(MAP_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read map data.' });
  }
});

// POST /api/map - Upload/Update board state
app.post('/api/map', (req, res) => {
  const newBoard = req.body;
  if (!Array.isArray(newBoard) || newBoard.length !== 25) {
    return res.status(400).json({ error: 'Invalid board format. Expected array of 25 regions.' });
  }
  
  try {
    fs.writeFileSync(MAP_FILE, JSON.stringify(newBoard, null, 2), 'utf8');
    broadcastUpdate(newBoard);
    res.json({ message: 'Map updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save map data.' });
  }
});

// DELETE /api/map - Reset board state
app.delete('/api/map', (req, res) => {
  try {
    fs.writeFileSync(MAP_FILE, JSON.stringify(INITIAL_BOARD, null, 2), 'utf8');
    broadcastUpdate(INITIAL_BOARD);
    res.json({ message: 'Map reset successfully.', board: INITIAL_BOARD });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset map data.' });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
});

server.listen(PORT, () => {
  console.log(`Backend server with WebSockets running on http://localhost:${PORT}`);
});
