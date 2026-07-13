import express from 'express';
import multer from 'multer';
import { runDetailedSimulation, runBasicSimulation, runFullSimulation } from '../services/simulationService.js';

const router = express.Router();
const upload = multer();

router.post('/detailed', (req, res) => {
  const { set } = req.query;
  const { setsData: uploadedSets, eventsData: uploadedEvents } = req.body || {};
  try {
    const gameHistory = runDetailedSimulation(set, uploadedSets, uploadedEvents);
    res.json(gameHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Detailed simulation failed' });
  }
});

router.post('/full', upload.fields([
  { name: 'sets', maxCount: 1 },
  { name: 'game', maxCount: 1 },
  { name: 'events', maxCount: 1 }
]), (req, res) => {
  let setsConfig, gameConfig, eventsConfig;

  // Handle multipart files
  if (req.files) {
    if (req.files['sets']) {
      try {
        setsConfig = JSON.parse(req.files['sets'][0].buffer.toString());
      } catch (_err) {
        return res.status(400).json({ error: 'Invalid JSON in sets file' });
      }
    }
    if (req.files['game']) {
      try {
        gameConfig = JSON.parse(req.files['game'][0].buffer.toString());
      } catch (_err) {
        return res.status(400).json({ error: 'Invalid JSON in game file' });
      }
    }
    if (req.files['events']) {
      try {
        eventsConfig = JSON.parse(req.files['events'][0].buffer.toString());
      } catch (_err) {
        return res.status(400).json({ error: 'Invalid JSON in events file' });
      }
    }
  }

  // Fallback to JSON body if files not provided (for backward compatibility)
  if (!setsConfig) {
    if (typeof req.body?.sets === 'string') {
      try { setsConfig = JSON.parse(req.body.sets); } catch (_) { /* ignore */ }
    } else {
      setsConfig = req.body?.sets;
    }
  }
  if (!gameConfig) {
    if (typeof req.body?.game === 'string') {
      try { gameConfig = JSON.parse(req.body.game); } catch (_) { /* ignore */ }
    } else {
      gameConfig = req.body?.game;
    }
  }
  if (!eventsConfig) {
    if (typeof req.body?.events === 'string') {
      try { eventsConfig = JSON.parse(req.body.events); } catch (_) { /* ignore */ }
    } else {
      eventsConfig = req.body?.events;
    }
  }

  const count = parseInt(req.query.count || req.body?.count, 10) || 1;

  try {
    const results = [];
    for (let i = 1; i <= count; i++) {
      const setsClone = setsConfig ? JSON.parse(JSON.stringify(setsConfig)) : null;
      const gameClone = gameConfig ? JSON.parse(JSON.stringify(gameConfig)) : null;
      const eventsClone = eventsConfig ? JSON.parse(JSON.stringify(eventsConfig)) : null;

      const result = runFullSimulation(setsClone, gameClone, eventsClone);
      results.push({
        game: i,
        ...result
      });
    }
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Full simulation failed' });
  }
});

router.post('/batch', (req, res) => {
  const { set, count = 100 } = req.query;
  const { setsData: uploadedSets, eventsData: uploadedEvents } = req.body || {};
  try {
    const numGames = parseInt(count, 10) || 100;
    const results = [];
    for (let i = 1; i <= numGames; i++) {
      const result = runBasicSimulation(set, uploadedSets, uploadedEvents);
      results.push({
        game: i,
        ...result
      });
    }
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Batch simulation failed' });
  }
});

router.post('/', (req, res) => {
  const { set } = req.query;
  const { setsData: uploadedSets, eventsData: uploadedEvents } = req.body || {};
  try {
    const result = runBasicSimulation(set, uploadedSets, uploadedEvents);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

router.post('/:gameId', (req, res) => {
  const { set } = req.query;
  const { setsData: uploadedSets, eventsData: uploadedEvents } = req.body || {};
  try {
    const result = runBasicSimulation(set, uploadedSets, uploadedEvents);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

export default router;
