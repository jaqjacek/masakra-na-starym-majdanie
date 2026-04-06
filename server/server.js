import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import http from 'http';

import { RACES, DEFAULT_PLAYERS, INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG } from './constants.js';
import { 
  createEmptyRegions, 
  getRegionsInRange, 
  getBestTargetRegion 
} from './boardManager.js';
import { Scoring } from './scoring.js';
import { 
  loadSetFile, 
  sortSetsData, 
  generateSetData 
} from './setManager.js';
import { 
  GAMES_DIR, 
  SETS_DIR, 
  CONFIG_FILE, 
  CONFIGS_DIR,
  getGlobalConfig, 
  ensureGameDir, 
  getGameData, 
  saveFullState 
} from './gameLogic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "DELETE"] }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the frontend build
const DIST_PATH = path.join(process.cwd(), 'dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
}

// API Routes
app.get('/api/config', (req, res) => res.json(getGlobalConfig()));

app.get('/api/next-game-id', (req, res) => {
  try { 
    if (!fs.existsSync(GAMES_DIR)) return res.json({ id: 1 }); 
    const dirs = fs.readdirSync(GAMES_DIR); 
    const ids = dirs.map(d => parseInt(d)).filter(n => !isNaN(n)); 
    const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1; 
    res.json({ id: nextId }); 
  } catch (_err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/config', (req, res) => { 
  const config = getGlobalConfig(); 
  if (req.body.defaultSetName !== undefined) config.defaultSetName = req.body.defaultSetName; 
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2)); 
  res.json(config); 
});

app.get('/api/sets', (req, res) => { 
  try { 
    res.json(fs.readdirSync(SETS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))); 
  } catch (err) { res.status(500).json({ error: 'Failed' }); } 
});

app.get('/api/sets/details/:setName', (req, res) => { 
  try { res.json(loadSetFile(req.params.setName)); } 
  catch (err) { res.status(500).json({ error: 'Failed' }); } 
});

app.post('/api/sets/generate', (req, res) => {
  try {
    const { pawns, power, maxPower, displayName, description } = req.body;
    const files = fs.readdirSync(SETS_DIR).filter(f => f.startsWith('set_') && f.endsWith('.json'));
    let nextId = 1; 
    const ids = files.map(f => parseInt(f.replace('set_', '').replace('.json', ''))).filter(n => !isNaN(n)); 
    if (ids.length > 0) nextId = Math.max(...ids) + 1;
    const fileName = `set_${nextId}.json`; 
    const data = generateSetData(pawns, power, maxPower, { displayName, description }); 
    data.setName = fileName.replace('.json', ''); 
    fs.writeFileSync(path.join(SETS_DIR, fileName), JSON.stringify(data, null, 2)); 
    res.json({ message: 'Set generated', name: data.setName });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/sets/save/:setName', (req, res) => {
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

app.post('/api/sets/sort/:setName', (req, res) => {
  try { 
    const { setName } = req.params; 
    const data = loadSetFile(setName); 
    if (!data) return res.status(404).json({ error: 'Set not found' }); 
    const sorted = sortSetsData(data); 
    fs.writeFileSync(path.join(SETS_DIR, `${setName}.json`), JSON.stringify(sorted, null, 2)); 
    res.json({ message: 'Set sorted successfully', setsData: sorted }); 
  } catch (_err) { res.status(500).json({ error: 'Failed to sort set' }); }
});

app.post('/api/sets/default/:setName', (req, res) => {
  try { 
    const { setName } = req.params; 
    const sourcePath = path.join(SETS_DIR, `${setName}.json`); 
    const destPath = path.join(CONFIGS_DIR, 'set_default.json'); 
    if (!fs.existsSync(sourcePath)) return res.status(404).json({ error: 'Source set not found' }); 
    fs.copyFileSync(sourcePath, destPath); 
    res.json({ message: `Set ${setName} is now the default for new games.` }); 
  } catch (_err) { res.status(500).json({ error: 'Failed to set default' }); }
});

app.get('/api/map/:gameId', (req, res) => { 
  try { res.json(getGameData(req.params.gameId).data); } 
  catch (_err) { res.status(500).json({ error: 'Failed' }); } 
});

app.post('/api/map/:gameId', (req, res) => { 
  try { 
    saveFullState(req.params.gameId, req.body); 
    io.to(`game:${req.params.gameId}`).emit('boardUpdate', req.body); 
    res.json({ message: 'Saved' }); 
  } catch (_err) { res.status(500).json({ error: 'Failed' }); } 
});

app.delete('/api/map/:gameId', (req, res) => { 
  try { 
    const gamePath = ensureGameDir(req.params.gameId); 
    fs.rmSync(gamePath, { recursive: true, force: true }); 
    res.json({ message: 'Deleted' }); 
  } catch (_err) { res.status(500).json({ error: 'Failed' }); } 
});

app.delete('/api/games', (_req, res) => { 
  try { 
    if (fs.existsSync(GAMES_DIR)) { fs.rmSync(GAMES_DIR, { recursive: true, force: true }); } 
    fs.mkdirSync(GAMES_DIR); 
    res.json({ message: 'All games deleted' }); 
  } catch (_err) { res.status(500).json({ error: 'Failed' }); } 
});

app.post('/api/init/:gameId', (req, res) => {
  const { gameId } = req.params; const { set } = req.query;
  try {
    const regions = createEmptyRegions(); const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS)); const config = getGlobalConfig(); 
    let requestedSet = set; 
    if (!requestedSet && fs.existsSync(path.join(CONFIGS_DIR, 'set_default.json'))) requestedSet = 'set_default'; 
    if (!requestedSet) requestedSet = config.defaultSetName;
    let setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData(INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, 6);
    if (setsData.items && !setsData.drawPile) { setsData.drawPile = setsData.items; delete setsData.items; }
    if (!setsData.discardPile) setsData.discardPile = []; if (!setsData.heldSets) setsData.heldSets = [];
    const setName = setsData.setName || 'generated'; const playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    players.forEach(p => {
      for (let i = 0; i < 5; i++) { 
        if (setsData.drawPile.length === 0) break; 
        const s = setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0]; 
        s.ownerId = p.id; setsData.heldSets.push(s); 
      }
    });
    const finalState = { 
      regions, players, sets: setsData, phase: 'setup', currentRound: 1, 
      currentPlayerIndex: 0, playerOrder, passedPlayers: [], availableGenerals: [...RACES], 
      setName, history: [{time: new Date().toLocaleTimeString(), text: "Game started."}], 
      gameStatus: 'active', jakubAngerIncreased: false, jakubTurnExecuted: false 
    };
    saveFullState(gameId, finalState); 
    io.to(`game:${gameId}`).emit('boardUpdate', finalState); 
    res.json({ message: 'Initialized', state: finalState });
  } catch (_err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/simulate/:gameId', (req, res) => {
  const { set } = req.query;
  try {
    const regions = createEmptyRegions(); const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS)); const config = getGlobalConfig(); 
    let requestedSet = set; 
    if (!requestedSet && fs.existsSync(path.join(CONFIGS_DIR, 'set_default.json'))) requestedSet = 'set_default'; 
    if (!requestedSet) requestedSet = config.defaultSetName;
    let setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData(INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, 6);
    if (setsData.items && !setsData.drawPile) { setsData.drawPile = setsData.items; delete setsData.items; }
    if (!setsData.discardPile) setsData.discardPile = []; if (!setsData.heldSets) setsData.heldSets = [];
    let playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const drawSet = () => { 
      if (setsData.drawPile.length === 0) { 
        if (setsData.discardPile.length === 0) return null; 
        setsData.drawPile = [...setsData.discardPile]; setsData.discardPile = []; 
      } 
      return setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0]; 
    };
    players.forEach(p => { for (let i = 0; i < 5; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });
    const analytics = {
      vampire: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
      werewolf: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
      ghost: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 },
      bardak: { afterR1: 0, total: 0, finalBonus: 0, killed: 0, ramboPoints: 0 }
    };
    for (let round = 1; round <= 8; round++) {
      players.forEach(p => { const myHeld = setsData.heldSets.filter(s => s.ownerId === p.id); const needed = 5 - myHeld.length; for (let i = 0; i < needed; i++) { const s = drawSet(); if (s) { s.ownerId = p.id; setsData.heldSets.push(s); } } });
      for (let i = 0; i < 2; i++) { const s = drawSet(); if (s) { s.ownerId = 'jakub'; setsData.heldSets.push(s); } }
      let availableGenerals = [...RACES].sort(() => Math.random() - 0.5);
      playerOrder.forEach(id => { const p = players.find(x => x.id === id); p.generalOf = availableGenerals.pop(); });
      let passed = new Set();
      while (passed.size < players.length) {
        for (const id of playerOrder) {
          if (passed.has(id)) continue;
          const p = players.find(x => x.id === id); 
          const jakRIdx = regions.findIndex(r => r.pawns.jakub?.length > 0); 
          const jakubRegion = regions[jakRIdx];
          const myHeld = setsData.heldSets.filter(s => s.ownerId === p.id); 
          const emptyR = regions.filter(r => !RACES.some(race => r.pawns[race]?.length > 0));
          const onBoard = {}; RACES.forEach(r => onBoard[r] = 0);
          regions.forEach(r => Object.entries(r.pawns).forEach(([tid, insts]) => { if (onBoard[tid] !== undefined) onBoard[tid] += insts.length; }));
          const pool = { ...setsData.pawns }; RACES.forEach(r => pool[r] -= onBoard[r]);
          let best = null;
          myHeld.forEach(s => {
            let can = true; Object.entries(s.content).forEach(([tid, count]) => { if (pool[tid] < count) can = false; });
            if (!can) return;
            emptyR.forEach(r => { 
              const placementScores = Scoring.calculatePlacementPoints(regions, r, s.content);
              const pts = placementScores[p.generalOf] || 0; 
              if (!best || pts > best.pts) best = { s, r, pts, allScores: placementScores }; 
            });
            });
            if (best && best.pts > 1) { 
            players.forEach(beneficiary => { 
              if (beneficiary.generalOf) { 
                beneficiary.points += best.allScores[beneficiary.generalOf] || 0; 
              } 
            });
            Object.entries(best.s.content).forEach(([tid, count]) => { if (!best.r.pawns[tid]) best.r.pawns[tid] = []; for (let i = 0; i < count; i++) best.r.pawns[tid].push({ statuses: ['ENABLED'] }); }); 
            const idx = setsData.heldSets.findIndex(x => x.id === best.s.id); const used = setsData.heldSets.splice(idx, 1)[0]; used.ownerId = null; setsData.discardPile.push(used); 
            } else {            if (myHeld.length > 3) { const excess = myHeld.length - 3; const sorted = [...myHeld].sort((a,b) => (a.content[p.generalOf]||0) - (b.content[p.generalOf]||0)); for(let i=0; i<excess; i++) { const s = sorted[i]; s.ownerId = 'jakub'; } p.points += excess; }
            passed.add(id);
          }
        }
      }
      let jakR = regions.find(r => r.pawns.jakub?.length > 0); let jakub = jakR.pawns.jakub[0];
      const jakubSets = setsData.heldSets.filter(s => s.ownerId === 'jakub');
      jakubSets.forEach(s => { 
        Object.entries(s.content).forEach(([race, count]) => { 
          if (jakub.anger[race] !== undefined) {
            jakub.anger[race] += count;
          }
        });
      });
      // Recalculate range based on new rule: 1 + Σ (anger > 9 ? anger - 9 : 0)
      let extraRange = 0;
      Object.values(jakub.anger).forEach(val => { if (val > 9) extraRange += (val - 9); });
      jakub.range = 1 + extraRange;

      let continues = true;
      while (continues) {
        continues = false; let curR = regions.find(r => r.pawns.jakub?.length > 0);
        const sortedAngerRaces = RACES.map(r => ({ race: r, val: jakub.anger[r] })).filter(a => a.val > 0).sort((a,b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race)).map(a => a.race);
        if (sortedAngerRaces.length === 0) break;
        let actionFound = false;
        for (const race of sortedAngerRaces) {
          const units = curR.pawns[race]?.length || 0;
          if (units > 0) { const killCount = Math.min(units, jakub.anger[race]); const p = players.find(x => x.generalOf === race); if (p) p.points = Math.max(0, p.points - killCount); analytics[race].killed += killCount; jakub.anger[race] -= killCount; curR.pawns[race].splice(0, killCount); if (curR.pawns[race].length === 0) delete curR.pawns[race]; continues = true; actionFound = true; break; }
        }
        if (actionFound) continue;
        const candidates = getRegionsInRange(regions, curR.id, jakub.range); const bestRIdx = getBestTargetRegion(candidates, sortedAngerRaces, regions);
        if (bestRIdx !== null) { 
          regions[bestRIdx].pawns.jakub = curR.pawns.jakub; 
          delete curR.pawns.jakub; 
          jakub.range = Math.max(0, jakub.range - 1); // Decrease range on move
          continues = true; 
        }
      }
      let jakR_after = regions.find(r => r.pawns.jakub?.length > 0);
      if (jakR_after) {
        RACES.forEach(race => {
          const count = jakR_after.pawns[race]?.length || 0;
          if (count > 0) { const pts = count * 2; const p = players.find(x => x.generalOf === race); if (p) { p.points += pts; analytics[race].ramboPoints += pts; } }
        });
      }
      jakub.range = 0; // Range falls to 0 after Jakub's phase
      jakubSets.forEach(s => { const idx = setsData.heldSets.findIndex(x => x.id === s.id); const recycled = setsData.heldSets.splice(idx, 1)[0]; recycled.ownerId = null; recycled.used = false; setsData.discardPile.push(recycled); });
      if (round === 1) { players.forEach(p => { if (p.generalOf) analytics[p.generalOf].afterR1 = p.points; }); }
      if (round < 8) { players.forEach(p => p.generalOf = null); playerOrder = [...players].sort((a,b) => a.points - b.points).map(p => p.id); }
    }
    players.forEach(p => {
      const pick = p.generalOf; if (!pick) return;
      let addedPoints = 0;
      if (pick === 'vampire') { let count = 0; regions.forEach(r => count += (r.pawns[pick]?.length || 0)); addedPoints = count * 2; }
      else if (pick === 'werewolf') { let count = 0; regions.forEach(r => count += (r.pawns[pick]?.length || 0)); addedPoints = count; }
      else if (pick === 'ghost') {
        regions.forEach(r => {
          const myCount = r.pawns[pick]?.length || 0;
          if (myCount > 0) {
            let others = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0);
            if (others.reduce((a,b)=>a+b,0) === 0) addedPoints += 2; else if (myCount > Math.max(...others)) addedPoints += 1;
          }
        });
      } else if (pick === 'bardak') {
        regions.forEach(r => {
          const myCount = r.pawns[pick]?.length || 0; if (myCount > 0) { let othersCounts = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0); const maxOther = Math.max(...othersCounts); if (myCount > maxOther) addedPoints += 1; }
        });
      }
      p.points += addedPoints; analytics[pick].finalBonus = addedPoints; analytics[pick].total = p.points;
    });
    res.json({ analytics });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Simulation failed' }); }
});

app.use((err, req, res, next) => { console.error("SERVER ERROR:", err); res.status(500).json({ error: "Internal Server Error" }); });

// Catch-all route for React Router
app.get('*path', (req, res) => {
  const indexPath = path.join(process.cwd(), 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built');
  }
});

io.on('connection', (socket) => { 
  const gameId = socket.handshake.query.gameId;
  if (gameId) socket.join(`game:${gameId}`);
  socket.on('joinGame', id => socket.join(`game:${id}`)); 
});

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
