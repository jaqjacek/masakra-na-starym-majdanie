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
  if (fs.existsSync(setPath)) return JSON.parse(fs.readFileSync(setPath, 'utf8'));
  return null;
};

const generateSetData = (pawnsConfig, powerConfig, maxPower, meta = {}) => {
  const totals = { ...pawnsConfig };
  const items = [];
  let setId = 1;
  const getAvailable = () => Object.keys(totals).filter(t => totals[t] > 0);
  while (getAvailable().length > 0) {
    const available = getAvailable();
    const selected = [...available].sort(() => Math.random() - 0.5).slice(0, 3);
    const content = {};
    let curPwr = 0; let curCnt = 0;
    selected.forEach(t => {
      if (totals[t] > 0 && curPwr + powerConfig[t] <= maxPower && curCnt + 1 <= 5) {
        content[t] = 1; totals[t]--; curPwr += powerConfig[t]; curCnt++;
      }
    });
    let improved = true;
    while (improved && curPwr < maxPower && curCnt < 5) {
      improved = false;
      for (const t of selected) {
        if (totals[t] > 0 && curPwr + powerConfig[t] <= maxPower && curCnt + 1 <= 5) {
          content[t] = (content[t] || 0) + 1; totals[t]--; curPwr += powerConfig[t]; curCnt++;
          improved = true; break;
        }
      }
    }
    if (curCnt > 0) items.push({ id: setId++, content, used: false, power: curPwr, ownerId: null });
    else break;
  }
  return { pawns: pawnsConfig, power: powerConfig, items, maxPower, ...meta };
};

const createEmptyRegions = () => {
  const size = 5;
  const regions = [];
  for (let i = 0; i < size * size; i++) {
    regions.push({ id: i, x: i % size, y: Math.floor(i / size), neighbors: [], pawns: {} });
  }
  regions.forEach(region => {
    const { x, y } = region;
    if (y > 0) region.neighbors.push((y - 1) * size + x);
    if (y < size - 1) region.neighbors.push((y + 1) * size + x);
    if (x > 0) region.neighbors.push(y * size + (x - 1));
    if (x < size - 1) region.neighbors.push(y * size + (x + 1));
  });
  const interior = regions.filter(r => r.x > 0 && r.x < 4 && r.y > 0 && r.y < 4).map(r => r.id);
  const rIdx = interior[Math.floor(Math.random() * interior.length)];
  regions[rIdx].pawns.jakub = [{ statuses: ['ENABLED'], speed: 1, range: 1, anger: { vampire: 0, werewolf: 0, ghost: 0, bardak: 0 } }];
  return regions;
};

// Internal simulation logic (Dry run, no broadcasting)
const getManhattanDistance = (r1, r2) => Math.abs(r1.x - r2.x) + Math.abs(r1.y - r2.y);
const calculateSetPlacementPoints = (race, setContent, targetRegion, jakubRegion) => {
  const dist = jakubRegion ? getManhattanDistance(targetRegion, jakubRegion) : 999;
  const ownPawnsInSet = setContent[race] || 0;
  if (race === 'vampire') return ownPawnsInSet + (3 - dist);
  if (race === 'werewolf') return (dist <= 2) ? (ownPawnsInSet + 1) : 0;
  if (race === 'bardak') return Object.values(setContent).reduce((a, b) => a + b, 0);
  if (race === 'ghost') return ownPawnsInSet + (dist <= 2 ? -1 : 1);
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
  let sets = fs.existsSync(setsPath) ? JSON.parse(fs.readFileSync(setsPath, 'utf8')) : generateSetData({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 }, 6);

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
    fs.writeFileSync(path.join(SETS_DIR, fileName), JSON.stringify(data, null, 2));
    res.json({ message: 'Set generated', name: fileName.replace('.json', '') });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
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

app.post('/api/init/:gameId', (req, res) => {
  const { gameId } = req.params;
  const { set } = req.query;
  try {
    const regions = createEmptyRegions();
    const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
    const config = getGlobalConfig();
    const requestedSet = set || config.defaultSetName;
    let setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 }, 6);
    const setName = requestedSet || 'generated';
    const playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const jakubRegion = regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
    
    // Initial 2 sets each
    const globalSets = setsData.items.filter(s => s.ownerId === null && !s.used);
    players.forEach(p => {
      for (let i = 0; i < 2; i++) {
        const s = globalSets.splice(Math.floor(Math.random() * globalSets.length), 1)[0];
        s.ownerId = p.id;
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
    // 1. INIT
    const regions = createEmptyRegions();
    const players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
    const config = getGlobalConfig();
    const requestedSet = set || config.defaultSetName;
    let setsData = (requestedSet ? loadSetFile(requestedSet) : null) || generateSetData({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 }, 6);
    let playerOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    
    // Initial 2 sets
    let globalSets = setsData.items.filter(s => s.ownerId === null && !s.used);
    players.forEach(p => {
      for (let i = 0; i < 2; i++) {
        const s = globalSets.splice(Math.floor(Math.random() * globalSets.length), 1)[0];
        s.ownerId = p.id;
      }
    });

    // 2. RUN 6 ROUNDS
    for (let round = 1; round <= 6; round++) {
      // SETUP: Distribute Sets
      globalSets = setsData.items.filter(s => s.ownerId === null && !s.used);
      if (globalSets.length >= 4) {
        const perPlayer = Math.min(5, Math.floor(globalSets.length / 4));
        players.forEach(p => {
          for (let i = 0; i < perPlayer; i++) {
            if (globalSets.length === 0) break;
            const s = globalSets.splice(Math.floor(Math.random() * globalSets.length), 1)[0];
            s.ownerId = p.id;
          }
        });
      }

      // PLAYER PHASE: Role Pick
      let availableGenerals = [...RACES].sort(() => Math.random() - 0.5);
      playerOrder.forEach(id => {
        const p = players.find(x => x.id === id);
        p.generalOf = availableGenerals.pop();
      });

      // PLAYER PHASE: Set Placement Loop
      let passed = new Set();
      while (passed.size < players.length) {
        for (const id of playerOrder) {
          if (passed.has(id)) continue;
          const p = players.find(x => x.id === id);
          const jakubRegion = regions.find(r => r.pawns.jakub?.length > 0);
          const mySets = setsData.items.filter(s => s.ownerId === p.id && !s.used);
          const emptyR = regions.filter(r => !RACES.some(race => r.pawns[race]?.length > 0));
          
          // Pool check
          const onBoard = {}; RACES.forEach(r => onBoard[r] = 0);
          regions.forEach(r => Object.entries(r.pawns).forEach(([tid, insts]) => { if (onBoard[tid] !== undefined) onBoard[tid] += insts.length; }));
          const pool = { ...setsData.pawns }; RACES.forEach(r => pool[r] -= onBoard[r]);

          let best = null;
          mySets.forEach(s => {
            let can = true; Object.entries(s.content).forEach(([tid, count]) => { if (pool[tid] < count) can = false; });
            if (!can) return;
            emptyR.forEach(r => {
              const pts = calculateSetPlacementPoints(p.generalOf, s.content, r, jakubRegion);
              if (!best || pts > best.pts) best = { s, r, pts };
            });
          });

          if (best && !(best.pts <= 0 && mySets.length <= 2)) {
            Object.entries(best.s.content).forEach(([tid, count]) => {
              if (!best.r.pawns[tid]) best.r.pawns[tid] = [];
              for (let i = 0; i < count; i++) best.r.pawns[tid].push({ statuses: ['ENABLED'] });
            });
            p.points += best.pts;
            best.s.used = false; best.s.ownerId = null; // Recycle
          } else {
            passed.add(id);
          }
        }
      }

      // JAKUB PHASE
      let jakub = null;
      for (const r of regions) { if (r.pawns.jakub?.length > 0) { jakub = r.pawns.jakub[0]; break; } }
      // Anger
      const incr = { vampire: [1,3], werewolf: [2,3], ghost: [2,4], bardak: [3,5] };
      RACES.forEach(race => { jakub.anger[race] = Math.min(9, jakub.anger[race] + Math.floor(Math.random()*(incr[race][1]-incr[race][0]+1)) + incr[race][0]); });
      
      // Spree
      let continues = true;
      while (continues) {
        continues = false;
        let curR = regions.find(r => r.pawns.jakub?.length > 0);
        // Kill
        RACES.forEach(race => {
          const count = curR.pawns[race]?.length || 0;
          if (count > 0) {
            const p = players.find(x => x.generalOf === race);
            if (p) p.points = Math.max(0, p.points - count);
            jakub.anger[race] = Math.max(0, jakub.anger[race] - count);
            curR.pawns[race] = [];
          }
        });
        // Move
        const targets = RACES.map(r => ({ race: r, val: jakub.anger[r] })).filter(a => a.val > 0).sort((a,b) => b.val - a.val);
        for (const t of targets) {
          const nIdx = curR.neighbors.find(idx => regions[idx].pawns[t.race]?.length > 0);
          if (nIdx !== undefined) {
            regions[nIdx].pawns.jakub = curR.pawns.jakub;
            delete curR.pawns.jakub;
            continues = true; break;
          }
        }
      }

      // ROUND CLEANUP
      players.forEach(p => p.generalOf = null);
      playerOrder = [...players].sort((a,b) => a.points - b.points).map(p => p.id);
    }

    // 3. FINAL SCORING
    let availableRoles = [...RACES].sort(() => Math.random() - 0.5);
    playerOrder.forEach(id => {
      const p = players.find(x => x.id === id);
      const pick = availableRoles.pop();
      p.generalOf = pick;
      
      let addedPoints = 0;
      if (pick === 'vampire') {
        let count = 0;
        regions.forEach(r => count += (r.pawns[pick]?.length || 0));
        addedPoints = count * 2;
      } else if (pick === 'werewolf') {
        let count = 0;
        regions.forEach(r => count += (r.pawns[pick]?.length || 0));
        addedPoints = count;
      } else if (pick === 'ghost') {
        regions.forEach(r => {
          const myCount = r.pawns[pick]?.length || 0;
          if (myCount > 0) {
            let othersCounts = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0);
            const othersTotal = othersCounts.reduce((a, b) => a + b, 0);
            if (othersTotal === 0) {
              addedPoints += 2;
            } else {
              const maxOther = Math.max(...othersCounts);
              if (myCount > maxOther) addedPoints += 1;
            }
          }
        });
      } else if (pick === 'bardak') {
        regions.forEach(r => {
          const myCount = r.pawns[pick]?.length || 0;
          if (myCount > 0) {
            let othersTotal = 0;
            RACES.forEach(race => { if (race !== pick) othersTotal += (r.pawns[race]?.length || 0); });
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
io.on('connection', (socket) => { socket.on('joinGame', id => socket.join(`game:${id}`)); });
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
