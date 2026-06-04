import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import { apiReference } from '@scalar/express-api-reference';

// Routes
import configRouter from './routes/config.js';
import setsRouter from './routes/sets.js';
import gamesRouter from './routes/games.js';
import simulationRouter from './routes/simulation.js';
import eventsRouter from './routes/events.js';

// Socket Handler
import { setupSocketHandlers } from './socketHandler.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "DELETE"] }
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

const PORT = process.env.PORT || 3001;
const DIST_PATH = path.join(process.cwd(), 'dist');

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Documentation
app.use(
  '/api/docs/api',
  apiReference({
    theme: 'purple',
    spec: {
      content: JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs/openapi.json'), 'utf8')),
    },
  })
);
app.get('/api/docs/game', (req, res) => res.sendFile(path.join(process.cwd(), 'docs/GAME_RULES.md')));

// Static Files
if (fs.existsSync(DIST_PATH)) {
  console.log(`Serving static files from: ${DIST_PATH}`);
  app.use(express.static(DIST_PATH));
} else {
  console.error(`CRITICAL: DIST_PATH does not exist: ${DIST_PATH}`);
}

// Health check
app.get('/api/ping', (req, res) => res.send('pong'));

// API Routes
app.use('/api/config', configRouter);
app.use('/api/sets', setsRouter);
app.use('/api/map', gamesRouter);
app.use('/api/simulate', simulationRouter);
app.use('/api/events', eventsRouter);

// Socket Logic
setupSocketHandlers(io);

// Error Handler
app.use((err, _req, res, _next) => { 
  console.error("SERVER ERROR:", err); 
  res.status(500).json({ error: "Internal Server Error" }); 
});

// Catch-all for SPA
app.get(/^(?!\/api).+/, (req, res) => {
  const indexPath = path.join(DIST_PATH, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`Frontend build missing at: ${indexPath}`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  if (fs.existsSync(DIST_PATH)) {
    console.log(`DIST folder contains: ${fs.readdirSync(DIST_PATH).join(', ')}`);
  }
});
