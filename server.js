import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GAMES_DIR = path.join(__dirname, 'games');
const SETS_DIR = path.join(__dirname, 'sets');
const CONFIG_FILE = path.join(__dirname, 'server_config.json');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "DELETE"] }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

if (!fs.existsSync(GAMES_DIR)) fs.mkdirSync(GAMES_DIR);
if (!fs.existsSync(SETS_DIR)) fs.mkdirSync(SETS_DIR);

const getGlobalConfig = () => {
  if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const defaultConfig = { defaultSetName: null };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  return defaultConfig;
};

const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];
const DEFAULT_PLAYERS = [
  { id: 1, name: '1', points: 30, generalOf: null },
  { id: 2, name: '2', points: 30, generalOf: null },
  { id: 3, name: '3', points: 30, generalOf: null },
  { id: 4, name: '4', points: 30, generalOf: null }
];

const ensureGameDir = (gameId) => {
  const pathDir = path.join(GAMES_DIR, String(gameId));
  if (!fs.existsSync(pathDir)) fs.mkdirSync(pathDir, { recursive: true });
  return pathDir;
};

const loadSetFile = (setName) => {
  const setPath = path.join(SETS_DIR, `${setName}.json`);
  if (fs.existsSync(setPath)) {
    const data = JSON.parse(fs.readFileSync(setPath, 'utf8'));
    data.setName = setName;
    return data;
  }
  return null;
};

const generateSetData = (pawnsConfig, powerConfig, maxPower, meta = {}) => {
  const totals = { ...pawnsConfig };
  const items = [];
  let setId = 1;
  const RARE_LIMITS = { vampire: 1, werewolf: 1, ghost: 2 };
  const getAvailableRare = () => Object.keys(RARE_LIMITS).filter(t => totals[t] > 0);

  while (getAvailableRare().length > 0) {
    const content = {};
    let curPwr = 0; let curCnt = 0;
    Object.keys(RARE_LIMITS).forEach(t => {
      const limit = RARE_LIMITS[t];
      for (let i = 0; i < limit; i++) {
        if (totals[t] > 0 && curPwr + powerConfig[t] <= maxPower && curCnt < 5) {
          content[t] = (content[t] || 0) + 1; totals[t]--; curPwr += powerConfig[t]; curCnt++;
        }
      }
    });
    while (totals.bardak > 0 && curPwr + powerConfig.bardak <= maxPower && curCnt < 5) {
      content.bardak = (content.bardak || 0) + 1; totals.bardak--; curPwr += powerConfig.bardak; curCnt++;
    }
    if (curCnt > 0) items.push({ id: setId++, content, used: false, power: curPwr, ownerId: null });
  }
  while (totals.bardak > 0) {
    const content = { bardak: 0 };
    let curPwr = 0; let curCnt = 0;
    while (totals.bardak > 0 && curPwr + powerConfig.bardak <= maxPower && curCnt < 5) {
      content.bardak++; totals.bardak--; curPwr += powerConfig.bardak; curCnt++;
    }
    if (curCnt > 0) items.push({ id: setId++, content, used: false, power: curPwr, ownerId: null });
  }
  const bardakOnly = items.filter(it => Object.keys(it.content).length === 1 && it.content.bardak);
  const smallBardak = bardakOnly.find(it => it.content.bardak < 3);
  if (smallBardak && bardakOnly.length > 1) {
    const other = bardakOnly.find(it => it.id !== smallBardak.id);
    if (other) {
      const totalB = smallBardak.content.bardak + other.content.bardak;
      const half = Math.floor(totalB / 2);
      smallBardak.content.bardak = half; smallBardak.power = half * powerConfig.bardak;
      other.content.bardak = totalB - half; other.power = (totalB - half) * powerConfig.bardak;
    }
  }
  return { pawns: pawnsConfig, power: powerConfig, drawPile: items, discardPile: [], heldSets: [], maxPower, setName: 'generated', ...meta };
};

const createEmptyRegions = () => {
  const size = 5;
  const regions = [];
  for (let i = 0; i < size * size; i++) {
    regions.push({ id: i, x: i % size, y: Math.floor(i / size), neighbors: [], pawns: {} });
  }
  // NEW NEIGHBOR LOGIC: Horizontal, Vertical, and Diagonal
  regions.forEach(region => {
    const { x, y } = region;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          region.neighbors.push(ny * size + nx);
        }
      }
    }
  });
  const interior = regions.filter(r => r.x > 0 && r.x < 4 && r.y > 0 && r.y < 4).map(r => r.id);
  const rIdx = interior[Math.floor(Math.random() * interior.length)];
  regions[rIdx].pawns.jakub = [{ statuses: ['ENABLED'], speed: 1, range: 1, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }];
  return regions;
};

// Chebyshev distance (King's Move)
const getChebyshevDistance = (r1, r2) => {
  if (!r1 || !r2) return 999;
  return Math.max(Math.abs(r1.x - r2.x), Math.abs(r1.y - r2.y));
};

const calculateSetPlacementPoints = (race, setContent, targetRegion, jakubRegion) => {
  const dist = jakubRegion ? getChebyshevDistance(targetRegion, jakubRegion) : 999;
  const ownPawnsInSet = setContent[race] || 0;
  if (race === 'vampire') return ownPawnsInSet + (3 - dist);
  if (race === 'werewolf') return (dist <= 2) ? (ownPawnsInSet + 1) : 0;
  if (race === 'bardak') return Object.values(setContent).reduce((a, b) => a + b, 0);
  if (race === 'ghost') {
    const isBorder = targetRegion.x === 0 || targetRegion.x === 4 || targetRegion.y === 0 || targetRegion.y === 4;
    if (isBorder) {
      let pts = ownPawnsInSet;
      const jakubRange = jakubRegion ? jakubRegion.pawns.jakub[0].range : 0;
      if (dist <= jakubRange) pts -= 1;
      return pts;
    }
    return ownPawnsInSet + (dist > 2 ? 1 : -1);
  }
  return 0;
};

const getGameData = (gameId) => {
  const gamePath = ensureGameDir(gameId);
  const mapPath = path.join(gamePath, 'map.json');
  const playersPath = path.join(gamePath, 'players.json');
  const setsPath = path.join(gamePath, 'sets.json');
  const statePath = path.join(gamePath, 'state.json');
  const historyPath = path.join(gamePath, 'history.json');

  let regions = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, 'utf8')) : createEmptyRegions();
  let players = fs.existsSync(playersPath) ? JSON.parse(fs.readFileSync(playersPath, 'utf8')) : JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
  let history = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, 'utf8')) : [];
  let gameState = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { phase: 'setup', currentRound: 1, currentPlayerIndex: 0, playerOrder: [1, 2, 3, 4], passedPlayers: [], availableGenerals: [...RACES], setName: 'default', gameStatus: 'active' };
  
  let sets;
  if (fs.existsSync(setsPath)) {
    sets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
    if (sets.items && !sets.drawPile) { sets.drawPile = sets.items; delete sets.items; }
    if (!sets.discardPile) sets.discardPile = [];
    if (!sets.heldSets) sets.heldSets = [];
  } else {
    const config = getGlobalConfig();
    sets = (config.defaultSetName ? loadSetFile(config.defaultSetName) : null) || generateSetData({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 }, 6);
  }

  return { data: { regions, players, sets, history, ...gameState } };
};

const saveFullState = (gameId, data) => {
  const gamePath = ensureGameDir(gameId);
  if (data.regions) fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(data.regions, null, 2));
  if (data.players) fs.writeFileSync(path.join(gamePath, 'players.json'), JSON.stringify(data.players, null, 2));
  if (data.sets) fs.writeFileSync(path.join(gamePath, 'sets.json'), JSON.stringify(data.sets, null, 2));
  if (data.history) fs.writeFileSync(path.join(gamePath, 'history.json'), JSON.stringify(data.history, null, 2));
  const meta = {};
  const keys = ['phase', 'currentRound', 'currentPlayerIndex', 'playerOrder', 'passedPlayers', 'availableGenerals', 'setName', 'gameStatus', 'jakubAngerIncreased', 'jakubTurnExecuted'];
  keys.forEach(k => { if (data[k] !== undefined) meta[k] = data[k]; });
  fs.writeFileSync(path.join(gamePath, 'state.json'), JSON.stringify(meta, null, 2));
};

// --- API ---

app.get('/api/config', (req, res) => res.json(getGlobalConfig()));
app.get('/api/next-game-id', (req, res) => {
  try {
    if (!fs.existsSync(GAMES_DIR)) return res.json({ id: 1 });
    const dirs = fs.readdirSync(GAMES_DIR);
    const ids = dirs.map(d => parseInt(d)).filter(n => !isNaN(n));
    const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    res.json({ id: nextId });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});
app.post('/api/config', (req, res) => {
  const config = getGlobalConfig();
  if (req.body.defaultSetName !== undefined) config.defaultSetName = req.body.defaultSetName;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  res.json(config);
});

app.get('/api/sets', (req, res) => {
  try { res.json(fs.readdirSync(SETS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))); }
  catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/sets/details/:setName', (req, res) => {
  try { 
    const data = loadSetFile(req.params.setName);
    res.json(data); 
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
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
    const { setsData } = req.body;
    const { setName } = req.params;
    const setPath = path.join(SETS_DIR, `${setName}.json`);
    
    if (!fs.existsSync(setPath)) return res.status(404).json({ error: 'Set not found' });
    
    // Save the updated object
    fs.writeFileSync(setPath, JSON.stringify(setsData, null, 2));
    res.json({ message: 'Set saved successfully' });
  } catch (err) { res.status(500).json({ error: 'Failed to save set' }); }
});

app.get('/api/map/:gameId', (req, res) => {
  try { res.json(getGameData(req.params.gameId).data); } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/map/:gameId', (req, res) => {
  try { saveFullState(req.params.gameId, req.body); io.to(`game:${req.params.gameId}`).emit('boardUpdate', req.body); res.json({ message: 'Saved' }); }
  catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/map/:gameId', (req, res) => {
  try {
    const gamePath = ensureGameDir(req.params.gameId);
    fs.rmSync(gamePath, { recursive: true, force: true });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/games', (req, res) => {
  try {
    if (fs.existsSync(GAMES_DIR)) { fs.rmSync(GAMES_DIR, { recursive: true, force: true }); }
    fs.mkdirSync(GAMES_DIR);
    res.json({ message: 'All games deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/init/:gameId', (req, res) => {
  const { gameId } = req.params;
  const { set } = req.query;
  try {
    const regions = createEmptyRegions();
    const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
    const config = getGlobalConfig();
    const requestedSet = set || config.defaultSetName;
    let setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 }, 6);
    
    if (setsData.items && !setsData.drawPile) { setsData.drawPile = setsData.items; delete setsData.items; }
    if (!setsData.discardPile) setsData.discardPile = [];
    if (!setsData.heldSets) setsData.heldSets = [];

    const setName = setsData.setName || 'generated';
    const playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    
    players.forEach(p => {
      for (let i = 0; i < 2; i++) {
        if (setsData.drawPile.length === 0) break;
        const s = setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0];
        s.ownerId = p.id;
        setsData.heldSets.push(s);
      }
    });

    const finalState = { 
      regions, players, sets: setsData, phase: 'setup', currentRound: 1, 
      currentPlayerIndex: 0, playerOrder, passedPlayers: [], 
      availableGenerals: [...RACES], setName, history: [{time: new Date().toLocaleTimeString(), text: "Game started."}], 
      gameStatus: 'active', jakubAngerIncreased: false, jakubTurnExecuted: false 
    };
    saveFullState(gameId, finalState);
    io.to(`game:${gameId}`).emit('boardUpdate', finalState);
    res.json({ message: 'Initialized', state: finalState });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/simulate/:gameId', (req, res) => {
  const { gameId } = req.params;
  const { set } = req.query;
  try {
    const regions = createEmptyRegions();
    const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
    const config = getGlobalConfig();
    const requestedSet = set || config.defaultSetName;
    let setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 }, 6);
    
    if (setsData.items && !setsData.drawPile) { setsData.drawPile = setsData.items; delete setsData.items; }
    if (!setsData.discardPile) setsData.discardPile = [];
    if (!setsData.heldSets) setsData.heldSets = [];

    let playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    
    const drawSet = () => {
      if (setsData.drawPile.length === 0) {
        if (setsData.discardPile.length === 0) return null;
        setsData.drawPile = [...setsData.discardPile];
        setsData.discardPile = [];
      }
      return setsData.drawPile.splice(Math.floor(Math.random() * setsData.drawPile.length), 1)[0];
    };

    players.forEach(p => {
      for (let i = 0; i < 2; i++) {
        const s = drawSet();
        if (s) { s.ownerId = p.id; setsData.heldSets.push(s); }
      }
    });

    for (let round = 1; round <= 6; round++) {
      for (let i = 0; i < 3; i++) {
        const poolSize = setsData.drawPile.length + setsData.discardPile.length;
        if (poolSize >= players.length) {
          players.forEach(p => {
            const s = drawSet();
            if (s) { s.ownerId = p.id; setsData.heldSets.push(s); }
          });
        } else break;
      }
      for (let i = 0; i < 2; i++) {
        const s = drawSet();
        if (s) { s.ownerId = 'jakub'; setsData.heldSets.push(s); }
      }

      let availableGenerals = [...RACES].sort(() => Math.random() - 0.5);
      playerOrder.forEach(id => {
        const p = players.find(x => x.id === id);
        p.generalOf = availableGenerals.pop();
      });

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
              const pts = calculateSetPlacementPoints(p.generalOf, s.content, r, jakubRegion);
              if (!best || pts > best.pts) best = { s, r, pts };
            });
          });

          if (best && best.pts > 1) {
            Object.entries(best.s.content).forEach(([tid, count]) => {
              if (!best.r.pawns[tid]) best.r.pawns[tid] = [];
              for (let i = 0; i < count; i++) best.r.pawns[tid].push({ statuses: ['ENABLED'] });
            });
            p.points += best.pts;
            const idx = setsData.heldSets.findIndex(x => x.id === best.s.id);
            const used = setsData.heldSets.splice(idx, 1)[0];
            used.ownerId = null; setsData.discardPile.push(used);
          } else {
            if (myHeld.length > 2) {
              const excess = myHeld.length - 2;
              const sorted = [...myHeld].sort((a,b) => (a.content[p.generalOf]||0) - (b.content[p.generalOf]||0));
              for(let i=0; i<excess; i++) {
                const s = sorted[i]; s.ownerId = 'jakub';
              }
              p.points += excess;
            }
            passed.add(id);
          }
        }
      }

      let jakR = regions.find(r => r.pawns.jakub?.length > 0);
      let jakub = jakR.pawns.jakub[0];
      const jakubSets = setsData.heldSets.filter(s => s.ownerId === 'jakub');
      jakubSets.forEach(s => {
        Object.entries(s.content).forEach(([race, count]) => {
          jakub.anger[race] += count;
          while (jakub.anger[race] >= 10) { jakub.anger[race] = 5; jakub.range += 1; }
        });
      });
      
      let continues = true;
      while (continues) {
        continues = false;
        let curR = regions.find(r => r.pawns.jakub?.length > 0);
        const sortedAngerRaces = RACES.map(r => ({ race: r, val: jakub.anger[r] })).filter(a => a.val > 0).sort((a,b) => b.val - a.val || RACES.indexOf(a.race) - RACES.indexOf(b.race)).map(a => a.race);
        if (sortedAngerRaces.length === 0) break;

        let actionFound = false;
        for (const race of sortedAngerRaces) {
          const units = curR.pawns[race]?.length || 0;
          if (units > 0) {
            const killCount = Math.min(units, jakub.anger[race]);
            
            // Find player currently holding this General role
            const p = players.find(x => x.generalOf === race);
            if (p) {
              p.points = Math.max(0, p.points - killCount);
            }
            
            jakub.anger[race] -= killCount;
            curR.pawns[race].splice(0, killCount);
            if (curR.pawns[race].length === 0) delete curR.pawns[race];
            continues = true; actionFound = true; break;
          }
        }
        if (actionFound) continue;

        const candidates = getRegionsInRange(regions, curR.id, jakub.range);
        const bestRIdx = getBestTargetRegion(candidates, sortedAngerRaces, regions);
        if (bestRIdx !== null) {
          regions[bestRIdx].pawns.jakub = curR.pawns.jakub;
          delete curR.pawns.jakub;
          continues = true;
        }
      }

      jakub.range = Math.max(1, jakub.range - 1);
      jakubSets.forEach(s => {
        const idx = setsData.heldSets.findIndex(x => x.id === s.id);
        const recycled = setsData.heldSets.splice(idx, 1)[0];
        recycled.ownerId = null; recycled.used = false; setsData.discardPile.push(recycled);
      });

      players.forEach(p => p.generalOf = null);
      playerOrder = [...players].sort((a,b) => a.points - b.points).map(p => p.id);
    }

    let availableRoles = [...RACES].sort(() => Math.random() - 0.5);
    playerOrder.forEach(id => {
      const p = players.find(x => x.id === id);
      const pick = availableRoles.pop();
      p.generalOf = pick;
      let addedPoints = 0;
      if (pick === 'vampire') {
        let count = 0; regions.forEach(r => count += (r.pawns[pick]?.length || 0));
        addedPoints = count * 2;
      } else if (pick === 'werewolf') {
        let count = 0; regions.forEach(r => count += (r.pawns[pick]?.length || 0));
        addedPoints = count;
      } else if (pick === 'ghost') {
        regions.forEach(r => {
          const myCount = r.pawns[pick]?.length || 0;
          if (myCount > 0) {
            let others = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0);
            if (others.reduce((a,b)=>a+b,0) === 0) addedPoints += 2;
            else if (myCount > Math.max(...others)) addedPoints += 1;
          }
        });
      } else if (pick === 'bardak') {
        regions.forEach(r => {
          const myCount = r.pawns[pick]?.length || 0;
          if (myCount > 0) {
            let othersTotal = 0; RACES.forEach(race => { if (race !== pick) othersTotal += (r.pawns[race]?.length || 0); });
            if (myCount > othersTotal) addedPoints += 2;
          }
        });
      }
      p.points += addedPoints;
    });

    res.json({ scores: players.map(p => ({ id: p.id, race: p.generalOf, points: p.points })) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Simulation failed' }); }
});

app.use((err, req, res, next) => { console.error("SERVER ERROR:", err); res.status(500).json({ error: "Internal Server Error" }); });
io.on('connection', (socket) => { socket.to(`game:${socket.handshake.query.gameId}`).emit('userJoined', socket.id); socket.on('joinGame', id => socket.join(`game:${id}`)); });
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
