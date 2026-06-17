import express from 'express';
import fs from 'fs';
import path from 'path';
import { 
  GAMES_DIR, 
  CONFIGS_DIR,
  getGameData, 
  saveFullState,
  getNextGameId,
  backupRound,
  restoreRound,
  getAvailableRoundSaves
} from '../gameLogic.js';
import { 
  createEmptyRegions 
} from '../boardManager.js';
import { initializeGame } from '../services/gameService.js';
import { GameEventPhaseManager } from '../events/gameEventPhaseManager.js';
import { EventEffectManager } from '../events/eventEffectManager.js';
import { RACES } from '../constants.js';

const router = express.Router();

router.post('/:gameId/event-phase', (req, res) => {
  try {
    const { gameId } = req.params;
    const { data } = getGameData(gameId);
    
    // Ensure data has previous phase for logging
    data._previousPhase = data.phase;
    data.phase = 'event_phase';
    
    const eventManager = new GameEventPhaseManager(data);
    eventManager.executePhase();
    
    // Transition to next phase
    if (data.currentRound < data.totalRounds) {
      data.phase = 'setup';
      data.currentRound += 1;
      // Reset round-specific state
      data.availableGenerals = [...RACES];
      data.players.forEach(p => p.generalOf = null);
      data.passedPlayers = [];
      data.currentPlayerIndex = 0;
      data.playerOrder = [...data.players].sort((a, b) => a.points - b.points).map(p => p.id);
      data.turnActionExecuted = false;
    } else {
      data.phase = 'final_scoring';
    }
    
    saveFullState(gameId, data);
    if (data.phase === 'setup') {
      backupRound(gameId, data.currentRound);
    }
    req.app.get('io').to(`game:${gameId}`).emit('boardUpdate', data);
    res.json({ message: 'Event phase completed', state: data });
  } catch (err) {
    console.error('Event phase execution failed:', err);
    res.status(500).json({ error: 'Failed to execute event phase' });
  }
});

router.post('/:gameId/trigger-event/:eventId', (req, res) => {
  try {
    const { gameId, eventId } = req.params;
    const { data } = getGameData(gameId);
    
    const eventManager = new GameEventPhaseManager(data);
    eventManager.ensureEventState();
    
    // Find the event in the pool or drawn pile or from defaults
    let event = data.events?.pool?.find(e => String(e.id) === String(eventId)) 
                || data.events?.drawn?.find(e => String(e.id) === String(eventId));
                
    if (!event) {
      const defaultPath = path.join(CONFIGS_DIR, 'events_default.json');
      if (fs.existsSync(defaultPath)) {
        const allEvents = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
        event = allEvents.find(e => String(e.id) === String(eventId));
      }
    }
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Apply event effects
    eventManager.addLog(`--- Ręczne Wydarzenie: [${event.id}] ${event.title} ---`);
    eventManager.addLog(`Efekt: ${event.description}`);

    if (event.type === 'anger-plus' || event.type === 'anger-minus') {
      const jakub = eventManager.getJakubInterface();
      if (jakub) {
        const effectLog = EventEffectManager.applyAngerEffect(jakub, event.type, event.value);
        eventManager.addLog(effectLog);
      }
    } else if (event.type === 'pawnsTotal-plus' || event.type === 'pawnsTotal-minus') {
      const sets = eventManager.getSetsInterface();
      if (sets) {
        const effectLog = EventEffectManager.applyPawnLimitEffect(sets, event.type, event.value);
        eventManager.addLog(effectLog);
      }
    } else if (event.type === 'wipe-sectors') {
      const effectLog = EventEffectManager.applyWipeSectorsEffect(data, event.value);
      eventManager.addLog(effectLog);
    } else if (event.type === 'support') {
      const sets = eventManager.getSetsInterface();
      if (sets) {
        const effectLog = EventEffectManager.applySupportEffect(sets, event.value);
        eventManager.addLog(effectLog);
      }
    } else if (event.type === 'move') {
      const effectLog = EventEffectManager.applyMoveEffect(data, event.value);
      eventManager.addLog(effectLog);
    } else if (event.type === 'transformation') {
      const effectLog = EventEffectManager.applyTransformationEffect(data, event.value);
      eventManager.addLog(effectLog);
    }
    
    saveFullState(gameId, data);
    req.app.get('io').to(`game:${gameId}`).emit('boardUpdate', data);
    res.json({ message: 'Event triggered successfully', state: data });
  } catch (err) {
    console.error('Trigger event failed:', err);
    res.status(500).json({ error: 'Failed to trigger event' });
  }
});

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

router.get('/:gameId/saves', (req, res) => {
  try {
    const { gameId } = req.params;
    const saves = getAvailableRoundSaves(gameId);
    res.json({ saves });
  } catch (err) {
    console.error('Failed to get round saves:', err);
    res.status(500).json({ error: 'Failed to retrieve saves' });
  }
});

router.post('/:gameId/load-round/:round', (req, res) => {
  try {
    const { gameId, round } = req.params;
    const roundNum = parseInt(round);
    if (isNaN(roundNum)) return res.status(400).json({ error: 'Invalid round number' });
    
    restoreRound(gameId, roundNum);
    const { data } = getGameData(gameId);
    
    // Broadcast restored state to all clients
    req.app.get('io').to(`game:${gameId}`).emit('boardUpdate', data);
    res.json({ message: `Restored round ${roundNum}`, state: data });
  } catch (err) {
    console.error('Failed to load round save:', err);
    res.status(500).json({ error: 'Failed to load round' });
  }
});

export default router;
