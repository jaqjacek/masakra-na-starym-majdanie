import express from 'express';
import fs from 'fs';
import { GAMES_DIR, CONFIG_FILE, getGlobalConfig } from '../gameLogic.js';

const router = express.Router();

router.get('/', (req, res) => res.json(getGlobalConfig()));

router.post('/', (req, res) => {  const config = getGlobalConfig(); 
  if (req.body.defaultSetName !== undefined) config.defaultSetName = req.body.defaultSetName; 
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2)); 
  res.json(config); 
});

export default router;
