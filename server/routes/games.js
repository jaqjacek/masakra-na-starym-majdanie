import express from 'express';
import fs from 'fs';
import { 
  GAMES_DIR, 
  getGameData, 
  saveFullState,
  getNextGameId
} from '../gameLogic.js';
import { 
  createEmptyRegions 
} from '../boardManager.js';
import { initializeGame } from '../services/gameService.js';

const router = express.Router();

router.get('/next-id', (req, res) => {
  try {
    const id = getNextGameId();
    res.json({ id });
  } catch (_err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/:gameId', (req, res) => { 
  try { res.json(getGameData(req.params.gameId).data); } 
  catch (_err) { res.status(500).json({ error: 'Failed' }); } 
});

router.get('/status/:gameId', (req, res) => {
  try {
    const { data } = getGameData(req.params.gameId);
    res.json({
      gameId: req.params.gameId,
      players: data.players.map(p => ({
        id: p.id,
        name: p.name,
        points: p.points,
        generalOf: p.generalOf
      }))
    });
  } catch (_err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/:gameId/add', (req, res) => {
  try {
    const { gameId } = req.params; const { region, pawn } = req.query;
    const { data } = getGameData(gameId); const rIdx = parseInt(region);
    if (isNaN(rIdx) || !data.regions[rIdx]) return res.status(400).json({ error: 'Invalid region' });
    if (!data.regions[rIdx].pawns[pawn]) data.regions[rIdx].pawns[pawn] = [];
    data.regions[rIdx].pawns[pawn].push({ statuses: ['ENABLED'] });
    saveFullState(gameId, data);
    req.app.get('io').to(`game:${gameId}`).emit('boardUpdate', data);
    res.json({ message: `Added ${pawn} to region ${region}` });
  } catch (_err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/:gameId/remove', (req, res) => {
  try {
    const { gameId } = req.params; const { region, pawn } = req.query;
    const { data } = getGameData(gameId); const rIdx = parseInt(region);
    if (isNaN(rIdx) || !data.regions[rIdx]) return res.status(400).json({ error: 'Invalid region' });
    if (data.regions[rIdx].pawns[pawn] && data.regions[rIdx].pawns[pawn].length > 0) {
      data.regions[rIdx].pawns[pawn].pop();
      if (data.regions[rIdx].pawns[pawn].length === 0) delete data.regions[rIdx].pawns[pawn];
      saveFullState(gameId, data);
      req.app.get('io').to(`game:${gameId}`).emit('boardUpdate', data);
      res.json({ message: `Removed ${pawn} from region ${region}` });
    } else { res.status(400).json({ error: 'Pawn not found in region' }); }
  } catch (_err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/:gameId', (req, res) => { 
  try { 
    saveFullState(req.params.gameId, req.body); 
    req.app.get('io').to(`game:${req.params.gameId}`).emit('boardUpdate', req.body); 
    res.json({ message: 'Saved' }); 
  } catch (_err) { res.status(500).json({ error: 'Failed' }); } 
});

router.delete('/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const { data } = getGameData(gameId);
    data.regions = createEmptyRegions();
    saveFullState(gameId, data);
    req.app.get('io').to(`game:${gameId}`).emit('boardUpdate', data);
    res.json({ message: 'Board reset to empty' });
  } catch (_err) { res.status(500).json({ error: 'Failed' }); }
});

router.delete('/', (_req, res) => { 
  try { 
    if (fs.existsSync(GAMES_DIR)) { fs.rmSync(GAMES_DIR, { recursive: true, force: true }); } 
    fs.mkdirSync(GAMES_DIR); 
    res.json({ message: 'All games deleted' }); 
  } catch (_err) { res.status(500).json({ error: 'Failed' }); } 
});

router.post('/init/:gameId', (req, res) => {
  const { gameId } = req.params; const { set } = req.query;
  try {
    const finalState = initializeGame(gameId, set, req.app.get('io'));
    res.json({ message: 'Initialized', state: finalState });
  } catch (_err) { res.status(500).json({ error: 'Failed' }); }
});

export default router;
