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

const router = express.Router();

router.get('/', (req, res) => { 
  try { 
    res.json(fs.readdirSync(SETS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))); 
  } catch (_err) { res.status(500).json({ error: 'Failed' }); } 
});

router.get('/details/:setName', (req, res) => { 
  try { res.json(loadSetFile(req.params.setName)); } 
  catch (_err) { res.status(500).json({ error: 'Failed' }); } 
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

router.post('/save/:setName', (req, res) => {
  try {
    let { setsData } = req.body; const { setName } = req.params; 
    const setPath = path.join(SETS_DIR, `${setName}.json`); 
    if (!fs.existsSync(setPath)) return res.status(404).json({ error: 'Set not found' });
    const removeEmpty = (pile) => { if (!pile) return []; return pile.filter(s => Object.values(s.content || {}).reduce((a, b) => a + b, 0) > 0); };
    setsData.drawPile = removeEmpty(setsData.drawPile); 
    setsData.heldSets = removeEmpty(setsData.heldSets); 
    setsData.discardPile = removeEmpty(setsData.discardPile);
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
    fs.writeFileSync(path.join(SETS_DIR, `${setName}.json`), JSON.stringify(sorted, null, 2)); 
    res.json({ message: 'Set sorted successfully', setsData: sorted }); 
  } catch (_err) { res.status(500).json({ error: 'Failed to sort set' }); }
});

router.post('/default/:setName', (req, res) => {
  try { 
    const { setName } = req.params; 
    const sourcePath = path.join(SETS_DIR, `${setName}.json`); 
    const destPath = path.join(CONFIGS_DIR, 'set_default.json'); 
    if (!fs.existsSync(sourcePath)) return res.status(404).json({ error: 'Source set not found' }); 
    fs.copyFileSync(sourcePath, destPath); 
    res.json({ message: `Set ${setName} is now the default for new games.` }); 
  } catch (_err) { res.status(500).json({ error: 'Failed to set default' }); }
});

export default router;
