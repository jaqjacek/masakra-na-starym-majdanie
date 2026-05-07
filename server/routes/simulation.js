import express from 'express';
import multer from 'multer';
import { runDetailedSimulation, runBasicSimulation, runFullSimulation } from '../services/simulationService.js';

const router = express.Router();
const upload = multer();

router.post('/detailed', (req, res) => {
  const { set } = req.query;
  const { setsData: uploadedSets } = req.body;
  try {
    const gameHistory = runDetailedSimulation(set, uploadedSets);
    res.json(gameHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Detailed simulation failed' });
  }
});

router.post('/full', upload.fields([
  { name: 'sets', maxCount: 1 },
  { name: 'game', maxCount: 1 }
]), (req, res) => {
  let setsConfig, gameConfig;

  // Handle multipart files
  if (req.files) {
    if (req.files['sets']) {
      try {
        setsConfig = JSON.parse(req.files['sets'][0].buffer.toString());
      } catch (err) {
        return res.status(400).json({ error: 'Invalid JSON in sets file' });
      }
    }
    if (req.files['game']) {
      try {
        gameConfig = JSON.parse(req.files['game'][0].buffer.toString());
      } catch (err) {
        return res.status(400).json({ error: 'Invalid JSON in game file' });
      }
    }
  }

  // Fallback to JSON body if files not provided (for backward compatibility)
  if (!setsConfig) setsConfig = req.body.sets;
  if (!gameConfig) gameConfig = req.body.game;

  if (!setsConfig) return res.status(400).json({ error: 'Missing sets configuration' });
  
  try {
    const result = runFullSimulation(setsConfig, gameConfig);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Full simulation failed' });
  }
});

router.post('/', (req, res) => {
  const { set } = req.query;
  const { setsData: uploadedSets } = req.body;
  try {
    const result = runBasicSimulation(set, uploadedSets);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

router.post('/:gameId', (req, res) => {
  const { set } = req.query;
  const { setsData: uploadedSets } = req.body;
  try {
    const result = runBasicSimulation(set, uploadedSets);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

export default router;
