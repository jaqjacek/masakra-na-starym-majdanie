import express from 'express';
import fs from 'fs';
import path from 'path';
import { 
  SETS_DIR, 
  CONFIGS_DIR 
} from '../gameLogic.js';
import { 
  loadSetFile, 
  sortSetsData, 
  generateSetData 
} from '../setManager.js';
import { 
  INITIAL_PAWN_POOL, 
  PAWNS_IN_PLAY_LIMIT, 
  DEFAULT_POWER_CONFIG,
  MAX_POWER
} from '../constants.js';

const router = express.Router();

const updatePawnTotals = (setsData) => {
  if (!setsData) return;
  const totals = { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 };
  const allSets = [
    ...(setsData.drawPile || []),
    ...(setsData.heldSets || []),
    ...(setsData.discardPile || [])
  ];
  allSets.forEach(s => {
    Object.entries(s.content || {}).forEach(([race, count]) => {
      if (totals[race] !== undefined) {
        totals[race] += count;
      }
    });
  });
  setsData.pawns = totals;
};

// Ensure sets directory has set_default.json on startup
const ensureDefaultSetFile = () => {
  try {
    const files = fs.readdirSync(SETS_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
      const defaultSrc = path.join(CONFIGS_DIR, 'set_default.json');
      if (fs.existsSync(defaultSrc)) {
        fs.copyFileSync(defaultSrc, path.join(SETS_DIR, 'set_default.json'));
      }
    }
  } catch (err) {
    console.error('Error ensuring default set file:', err);
  }
};

router.get('/', (req, res) => { 
  try { 
    ensureDefaultSetFile();
    res.json(fs.readdirSync(SETS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))); 
  } catch (_err) { res.status(500).json({ error: 'Failed' }); } 
});

router.get('/details/:setName', (req, res) => { 
  try { res.json(loadSetFile(req.params.setName)); } 
  catch (_err) { res.status(500).json({ error: 'Failed' }); } 
});

router.post('/generate/transient', (req, res) => {
  try {
    const { pawns, pawnsInPlayLimit, power, maxPower, displayName, description } = req.body;
    
    // Fallback defaults
    const finalPawns = pawns || INITIAL_PAWN_POOL;
    const finalLimits = pawnsInPlayLimit || PAWNS_IN_PLAY_LIMIT;
    const finalPower = power || DEFAULT_POWER_CONFIG;
    const finalMaxPower = maxPower !== undefined ? maxPower : MAX_POWER;

    // Generate filename based on parameters: TV10-TW20-TG30-TB40_LV5-LW10-LG15-LB20
    const namePart1 = `TV${finalPawns.vampire || 0}-TW${finalPawns.werewolf || 0}-TG${finalPawns.ghost || 0}-TB${finalPawns.bardak || 0}`;
    const namePart2 = `LV${finalLimits.vampire || 0}-LW${finalLimits.werewolf || 0}-LG${finalLimits.ghost || 0}-LB${finalLimits.bardak || 0}`;
    const customName = `${namePart1}_${namePart2}`;

    const data = generateSetData(finalPawns, finalPower, finalMaxPower, { 
      displayName: displayName || customName, 
      description: description || 'Transient generated set', 
      pawnsInPlayLimit: finalLimits 
    }); 
    
    data.setName = customName;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transient set generation failed' });
  }
});

router.post('/generate', (req, res) => {
  try {
    const { pawns, pawnsInPlayLimit, power, maxPower, displayName, description } = req.body;
    const files = fs.readdirSync(SETS_DIR).filter(f => f.startsWith('set_') && f.endsWith('.json'));
    let nextId = 1; 
    const ids = files.map(f => parseInt(f.replace('set_', '').replace('.json', ''))).filter(n => !isNaN(n)); 
    if (ids.length > 0) nextId = Math.max(...ids) + 1;
    const fileName = `set_${nextId}.json`; 
    const data = generateSetData(pawns, power, maxPower, { displayName, description, pawnsInPlayLimit }); 
    data.setName = fileName.replace('.json', ''); 
    fs.writeFileSync(path.join(SETS_DIR, fileName), JSON.stringify(data, null, 2)); 
    res.json({ message: 'Set generated', name: data.setName });
  } catch (_err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/duplicate/:setName', (req, res) => {
  try {
    const { setName } = req.params;
    const sourcePath = path.join(SETS_DIR, `${setName}.json`);
    let sourceData;
    if (setName === 'set_default') {
      const defaultSrc = path.join(CONFIGS_DIR, 'set_default.json');
      if (fs.existsSync(defaultSrc)) {
        sourceData = JSON.parse(fs.readFileSync(defaultSrc, 'utf8'));
      }
    } else if (fs.existsSync(sourcePath)) {
      sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    }
    
    if (!sourceData) {
      return res.status(404).json({ error: 'Source set not found' });
    }

    const files = fs.readdirSync(SETS_DIR).filter(f => f.startsWith('set_') && f.endsWith('.json'));
    let nextId = 1;
    const ids = files.map(f => parseInt(f.replace('set_', '').replace('.json', ''))).filter(n => !isNaN(n));
    if (ids.length > 0) nextId = Math.max(...ids) + 1;
    const newSetName = `set_${nextId}`;
    const destPath = path.join(SETS_DIR, `${newSetName}.json`);

    sourceData.setName = newSetName;
    fs.writeFileSync(destPath, JSON.stringify(sourceData, null, 2));

    res.json({ message: 'Set duplicated successfully', name: newSetName });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to duplicate set' });
  }
});

router.post('/save/:setName', (req, res) => {
  try {
    let { setsData } = req.body; const { setName } = req.params; 
    const setPath = path.join(SETS_DIR, `${setName}.json`); 
    if (!fs.existsSync(setPath)) return res.status(404).json({ error: 'Set not found' });
    const removeEmpty = (pile) => { if (!pile) return []; return pile.filter(s => Object.values(s.content || {}).reduce((a, b) => a + b, 0) > 0); };
    setsData.drawPile = removeEmpty(setsData.drawPile); 
    setsData.heldSets = removeEmpty(setsData.heldSets); 
    setsData.discardPile = removeEmpty(setsData.discardPile);
    updatePawnTotals(setsData);
    fs.writeFileSync(setPath, JSON.stringify(setsData, null, 2)); 
    res.json({ message: 'Set saved and cleaned successfully' });
  } catch (_err) { res.status(500).json({ error: 'Failed to save set' }); }
});

router.post('/sort/:setName', (req, res) => {
  try { 
    const { setName } = req.params; 
    const data = loadSetFile(setName); 
    if (!data) return res.status(404).json({ error: 'Set not found' }); 
    const sorted = sortSetsData(data); 
    updatePawnTotals(sorted);
    fs.writeFileSync(path.join(SETS_DIR, `${setName}.json`), JSON.stringify(sorted, null, 2)); 
    res.json({ message: 'Set sorted successfully', setsData: sorted }); 
  } catch (_err) { res.status(500).json({ error: 'Failed to sort set' }); }
});

router.post('/default/:setName', (req, res) => {
  try { 
    const { setName } = req.params; 
    const { setsData } = req.body;
    const sourcePath = path.join(SETS_DIR, `${setName}.json`); 
    const destPath = path.join(CONFIGS_DIR, 'set_default.json'); 
    
    if (setsData) {
      const removeEmpty = (pile) => { if (!pile) return []; return pile.filter(s => Object.values(s.content || {}).reduce((a, b) => a + b, 0) > 0); };
      setsData.drawPile = removeEmpty(setsData.drawPile); 
      setsData.heldSets = removeEmpty(setsData.heldSets); 
      setsData.discardPile = removeEmpty(setsData.discardPile);
      updatePawnTotals(setsData);
      
      fs.writeFileSync(sourcePath, JSON.stringify(setsData, null, 2)); 
      fs.writeFileSync(destPath, JSON.stringify(setsData, null, 2)); 
      res.json({ message: `Set ${setName} is saved and set as default for new games.` });
    } else {
      if (!fs.existsSync(sourcePath)) return res.status(404).json({ error: 'Source set not found' }); 
      fs.copyFileSync(sourcePath, destPath); 
      res.json({ message: `Set ${setName} is now the default for new games.` }); 
    }
  } catch (_err) { res.status(500).json({ error: 'Failed to set default' }); }
});

export default router;
