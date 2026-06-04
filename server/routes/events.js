import express from 'express';
import fs from 'fs';
import path from 'path';
import { 
  EVENTS_DIR, 
  CONFIGS_DIR 
} from '../gameLogic.js';

const router = express.Router();

// Ensure events directory has events_default.json on startup
const ensureDefaultEventFile = () => {
  try {
    const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
      const defaultSrc = path.join(CONFIGS_DIR, 'events_default.json');
      if (fs.existsSync(defaultSrc)) {
        fs.copyFileSync(defaultSrc, path.join(EVENTS_DIR, 'events_default.json'));
      }
    }
  } catch (err) {
    console.error('Error ensuring default event file:', err);
  }
};

router.get('/', (req, res) => { 
  try { 
    ensureDefaultEventFile();
    res.json(fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))); 
  } catch (_err) { res.status(500).json({ error: 'Failed to read event lists' }); } 
});

router.get('/all', (req, res) => {
  try {
    const allEventsPath = path.join(CONFIGS_DIR, 'events_all.json');
    if (fs.existsSync(allEventsPath)) {
      res.json(JSON.parse(fs.readFileSync(allEventsPath, 'utf8')));
    } else {
      res.status(404).json({ error: 'Master events file not found' });
    }
  } catch (_err) {
    res.status(500).json({ error: 'Failed to load master events list' });
  }
});

router.get('/details/:listName', (req, res) => { 
  try { 
    const filePath = path.join(EVENTS_DIR, `${req.params.listName}.json`);
    if (fs.existsSync(filePath)) {
      res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    } else {
      res.status(404).json({ error: 'Event list not found' });
    }
  } 
  catch (_err) { res.status(500).json({ error: 'Failed to load event list details' }); } 
});

router.post('/create', (req, res) => {
  try {
    let { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    name = name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(EVENTS_DIR, `${name}.json`);
    if (fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'Event list with this name already exists' });
    }
    // Create empty list initially
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    res.json({ message: 'Event list created', name });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to create event list' });
  }
});

router.post('/save/:listName', (req, res) => {
  try {
    const { eventsData } = req.body; 
    const { listName } = req.params; 
    const filePath = path.join(EVENTS_DIR, `${listName}.json`); 
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Event list not found' });
    
    // Save only chosen events
    fs.writeFileSync(filePath, JSON.stringify(eventsData || [], null, 2)); 
    res.json({ message: 'Event list saved successfully' });
  } catch (_err) { res.status(500).json({ error: 'Failed to save event list' }); }
});

router.post('/default/:listName', (req, res) => {
  try { 
    const { listName } = req.params; 
    const { eventsData } = req.body;
    const sourcePath = path.join(EVENTS_DIR, `${listName}.json`); 
    const destPath = path.join(CONFIGS_DIR, 'events_default.json'); 
    
    if (eventsData) {
      fs.writeFileSync(sourcePath, JSON.stringify(eventsData, null, 2)); 
      fs.writeFileSync(destPath, JSON.stringify(eventsData, null, 2)); 
      res.json({ message: `Event list ${listName} is saved and set as default for games.` });
    } else {
      if (!fs.existsSync(sourcePath)) return res.status(404).json({ error: 'Source event list not found' }); 
      fs.copyFileSync(sourcePath, destPath); 
      res.json({ message: `Event list ${listName} is now the default for games.` }); 
    }
  } catch (_err) { res.status(500).json({ error: 'Failed to set default event list' }); }
});

export default router;
