import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RACES, DEFAULT_PLAYERS, INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, DEFAULT_GAME_CONFIG, PLAYER_IDS } from './constants.js';
import { createEmptyRegions } from './boardManager.js';
import { loadSetFile, generateSetData } from './setManager.js';
import { GameEventPhaseManager } from './events/gameEventPhaseManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const GAMES_DIR = path.join(__dirname, 'games');
export const SETS_DIR = path.join(__dirname, 'sets');
export const EVENTS_DIR = path.join(__dirname, 'events');
export const CONFIGS_DIR = path.join(__dirname, 'configs');
export const CONFIG_FILE = path.join(CONFIGS_DIR, 'server_config.json');
export const GAME_CONFIG_FILE = path.join(CONFIGS_DIR, 'game_config.json');

if (!fs.existsSync(GAMES_DIR)) fs.mkdirSync(GAMES_DIR);
if (!fs.existsSync(SETS_DIR)) fs.mkdirSync(SETS_DIR);
if (!fs.existsSync(EVENTS_DIR)) fs.mkdirSync(EVENTS_DIR);
if (!fs.existsSync(CONFIGS_DIR)) fs.mkdirSync(CONFIGS_DIR);

export const getGlobalConfig = () => {
  if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const defaultConfig = { defaultSetName: null };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  return defaultConfig;
};

export const getGameConfig = () => {
  if (fs.existsSync(GAME_CONFIG_FILE)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(GAME_CONFIG_FILE, 'utf8'));
      return { ...DEFAULT_GAME_CONFIG, ...fileConfig };
    } catch (err) {
      console.error('Error reading game_config.json:', err);
    }
  }
  return { ...DEFAULT_GAME_CONFIG };
};

export const getNextGameId = () => {
  if (!fs.existsSync(GAMES_DIR)) return 0;
  const dirs = fs.readdirSync(GAMES_DIR).filter(d => {
    const p = path.join(GAMES_DIR, d);
    return fs.statSync(p).isDirectory() && !isNaN(parseInt(d));
  });
  if (dirs.length === 0) return 0;
  const ids = dirs.map(d => parseInt(d));
  return Math.max(...ids) + 1;
};

export const ensureGameDir = (gameId) => {
  const pathDir = path.join(GAMES_DIR, String(gameId));
  if (!fs.existsSync(pathDir)) fs.mkdirSync(pathDir, { recursive: true });
  return pathDir;
};

export const getGameData = (gameId) => {
  const gamePath = ensureGameDir(gameId);
  const mapPath = path.join(gamePath, 'map.json');
  const playersPath = path.join(gamePath, 'players.json');
  const setsPath = path.join(gamePath, 'sets.json');
  const statePath = path.join(gamePath, 'state.json');
  const historyPath = path.join(gamePath, 'history.json');
  let regions = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, 'utf8')) : createEmptyRegions();
  let players = fs.existsSync(playersPath) ? JSON.parse(fs.readFileSync(playersPath, 'utf8')) : JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
  let history = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, 'utf8')) : [];
  const gameConfig = getGameConfig();
  let gameState = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { phase: 'setup', currentRound: 1, totalRounds: gameConfig.totalRounds, currentPlayerIndex: 0, playerOrder: [...PLAYER_IDS], passedPlayers: [], availableGenerals: [...RACES], setName: 'default', gameStatus: 'active', manualPlayers: [] };
  
  if (gameState.totalRounds === undefined) gameState.totalRounds = gameConfig.totalRounds;
  if (!gameState.manualPlayers) gameState.manualPlayers = [];
  
  let sets;
  if (fs.existsSync(setsPath)) {
    sets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
    if (sets.items && !sets.drawPile) { sets.drawPile = sets.items; delete sets.items; }
    if (!sets.discardPile) sets.discardPile = []; if (!sets.heldSets) sets.heldSets = [];
  } else {
    const defaultSetPath = path.join(CONFIGS_DIR, 'set_default.json');
    if (fs.existsSync(defaultSetPath)) { sets = JSON.parse(fs.readFileSync(defaultSetPath, 'utf8')); sets.setName = 'set_default'; }
    else { 
      const globalConfig = getGlobalConfig(); 
      const gameConfig = getGameConfig();
      sets = (globalConfig.defaultSetName ? loadSetFile(globalConfig.defaultSetName) : null) || generateSetData(INITIAL_PAWN_POOL, DEFAULT_POWER_CONFIG, gameConfig.maxPower, { maxUnitsPerSet: gameConfig.maxUnitsPerSet }); 
    }
  }
  
  const {
    regions: _ignoredRegions,
    players: _ignoredPlayers,
    sets: _ignoredSets,
    history: _ignoredHistory,
    ...stateMeta
  } = gameState;
  const data = { regions, players, sets, history, ...stateMeta };
  
  // Ensure events are initialized if missing
  if (!data.events) {
    const eventManager = new GameEventPhaseManager(data);
    eventManager.ensureEventState();
  }

  return { data };
};

export const saveFullState = (gameId, data) => {
  const gamePath = ensureGameDir(gameId);
  if (data.regions) fs.writeFileSync(path.join(gamePath, 'map.json'), JSON.stringify(data.regions, null, 2));
  if (data.players) fs.writeFileSync(path.join(gamePath, 'players.json'), JSON.stringify(data.players, null, 2));
  if (data.sets) fs.writeFileSync(path.join(gamePath, 'sets.json'), JSON.stringify(data.sets, null, 2));
  if (data.history) {
    if (data.history.length > 100) {
      data.history = data.history.slice(data.history.length - 100);
    }
    fs.writeFileSync(path.join(gamePath, 'history.json'), JSON.stringify(data.history, null, 2));
    const logContent = data.history.map(h => {
      const racePrefix = h.race ? ` [${h.race.toUpperCase()}]` : '';
      const pointsSuffix = h.points !== undefined ? ` (${h.points > 0 ? '+' : ''}${h.points} pts)` : '';
      return `[${h.time}]${racePrefix} ${h.text}${pointsSuffix}`;
    }).join('\n');
    fs.writeFileSync(path.join(gamePath, 'history.log'), logContent);
  }
  const meta = {}; 
  const keys = ['phase', 'currentRound', 'totalRounds', 'currentPlayerIndex', 'playerOrder', 'passedPlayers', 'availableGenerals', 'setName', 'gameStatus', 'events', '_lastLoggedPhase', 'turnActionExecuted', 'magnetismCount', 'manualPlayers', 'jakubPath', 'mercyActive', 'witnessGlows', 'magnetismPullRegions', 'stateVersion'];
  
  let phaseChanged = false;
  // Log phase transition if it changed
  if (data.phase && data._lastLoggedPhase !== data.phase) {
    phaseChanged = true;
    const phaseName = data.phase.toUpperCase().replace('_', ' ');
    if (!data.history) data.history = [];
    
    // Check if this phase was already logged recently to avoid duplicates
    const lastLog = data.history.length > 0 ? data.history[data.history.length - 1].text : '';
    if (!lastLog.includes(`--- Start of ${phaseName} ---`)) {
      data.history.push({
        time: new Date().toLocaleTimeString(),
        text: `--- Start of ${phaseName} ---`
      });
    }
    data._lastLoggedPhase = data.phase;
  }

  keys.forEach(k => { if (data[k] !== undefined) meta[k] = data[k]; });
  meta.stateVersion = (Number(data.stateVersion) || 0) + 1;
  data.stateVersion = meta.stateVersion;
  fs.writeFileSync(path.join(gamePath, 'state.json'), JSON.stringify(meta, null, 2));

  if (phaseChanged) {
    createSnapshot(gameId, data);
  }
};

export const createSnapshot = (gameId, data) => {
  const gamePath = ensureGameDir(gameId);
  const snapshotsDir = path.join(gamePath, 'snapshots');
  if (!fs.existsSync(snapshotsDir)) fs.mkdirSync(snapshotsDir, { recursive: true });
  
  const timestamp = Date.now();
  const snapshotId = `${data.currentRound}_${data.phase}_${timestamp}`;
  const snapshotDir = path.join(snapshotsDir, snapshotId);
  fs.mkdirSync(snapshotDir, { recursive: true });
  
  const files = ['map', 'players', 'sets', 'state', 'history'];
  files.forEach(f => {
    const src = path.join(gamePath, `${f}.json`);
    const dest = path.join(snapshotDir, `${f}.json`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
};

export const restoreSnapshot = (gameId, snapshotId) => {
  const gamePath = ensureGameDir(gameId);
  const snapshotsDir = path.join(gamePath, 'snapshots');
  const snapshotDir = path.join(snapshotsDir, snapshotId);
  
  if (!fs.existsSync(snapshotDir)) throw new Error('Snapshot not found');
  
  const files = ['map', 'players', 'sets', 'state', 'history'];
  files.forEach(f => {
    const src = path.join(snapshotDir, `${f}.json`);
    const dest = path.join(gamePath, `${f}.json`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
  
  // Extract target timestamp from snapshotId
  const match = snapshotId.match(/_(\d+)$/);
  if (match) {
    const targetTimestamp = parseInt(match[1], 10);
    // Delete newer snapshots
    const allSnapshots = fs.readdirSync(snapshotsDir);
    allSnapshots.forEach(snap => {
      const snapMatch = snap.match(/_(\d+)$/);
      if (snapMatch) {
        const snapTimestamp = parseInt(snapMatch[1], 10);
        if (snapTimestamp > targetTimestamp) {
          fs.rmSync(path.join(snapshotsDir, snap), { recursive: true, force: true });
        }
      }
    });
  }
};

export const getAvailableSnapshots = (gameId) => {
  const gamePath = ensureGameDir(gameId);
  const snapshotsDir = path.join(gamePath, 'snapshots');
  if (!fs.existsSync(snapshotsDir)) return [];
  
  const files = fs.readdirSync(snapshotsDir);
  const snapshots = [];
  files.forEach(file => {
    const match = file.match(/^(\d+)_([^_]+)_(\d+)$/);
    if (match) {
      snapshots.push({
        id: file,
        round: parseInt(match[1], 10),
        phase: match[2],
        timestamp: parseInt(match[3], 10)
      });
    }
  });
  
  // Sort descending (newest first)
  return snapshots.sort((a, b) => b.timestamp - a.timestamp);
};
