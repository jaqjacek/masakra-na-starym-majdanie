import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import './App.css';
import Board from './components/Board';
import Bag from './components/Bag';
import PawnGhost from './components/PawnGhost';
import LandingPage from './components/LandingPage';
import GameHeader from './components/GameHeader';
import JakubPanel from './components/JakubPanel';
import SetsPanel from './components/SetsPanel';
import PointsTracker from './components/PointsTracker';
import AdminPanel from './components/AdminPanel';
import HistoryPanel from './components/HistoryPanel';
import PawnStatusPopup from './components/PawnStatusPopup';
import { fetchMap, updateMap, resetMap } from './services/api';
import { io } from 'socket.io-client';
import { PAWN_TYPES, STATUSES } from './constants/pawnTypes';
import { applySetToJakubAnger, executeJakubStep } from './strategies/jakubStrategy';

const getTime = () => new Date().toLocaleTimeString();

const createEmptyBoard = () => {
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
  return regions;
};

const RACES = ['vampire', 'werewolf', 'ghost', 'bardak'];

const INITIAL_STATE = {
  regions: createEmptyBoard(),
  players: [
    { id: 1, name: '1', points: 30, generalOf: null },
    { id: 2, name: '2', points: 30, generalOf: null },
    { id: 3, name: '3', points: 30, generalOf: null },
    { id: 4, name: '4', points: 30, generalOf: null }
  ],
  sets: { drawPile: [], discardPile: [], heldSets: [], pawns: { bardak: 80, ghost: 30, werewolf: 20, vampire: 10 } },
  phase: 'setup',
  currentRound: 1,
  playerOrder: [1, 2, 3, 4],
  currentPlayerIndex: 0,
  passedPlayers: [],
  availableGenerals: [...RACES],
  jakubAngerIncreased: false,
  jakubTurnExecuted: false,
  gameStatus: 'active',
  history: []
};

const getReachableRegions = (board, startIndex, range) => {
  const reachable = new Set();
  const queue = [{ index: startIndex, dist: 0 }];
  const visited = new Set([startIndex]);
  while (queue.length > 0) {
    const { index, dist } = queue.shift();
    if (dist > 0) reachable.add(index);
    if (dist < range) {
      board[index].neighbors.forEach(nIdx => {
        if (!visited.has(nIdx)) { visited.add(nIdx); queue.push({ index: nIdx, dist: dist + 1 }); }
      });
    }
  }
  return Array.from(reachable);
};

const getManhattanDistance = (r1, r2) => {
  if (!r1 || !r2) return 999;
  return Math.abs(r1.x - r2.x) + Math.abs(r1.y - r2.y);
};

const calculateSetPlacementPoints = (race, setContent, targetRegion, jakubRegion) => {
  const dist = jakubRegion ? getManhattanDistance(targetRegion, jakubRegion) : 999;
  const ownPawnsInSet = setContent[race] || 0;
  if (race === 'vampire') return ownPawnsInSet + (3 - dist);
  if (race === 'werewolf') return (dist <= 2) ? (ownPawnsInSet + 1) : 0;
  if (race === 'bardak') return Object.values(setContent).reduce((a, b) => a + b, 0);
  if (race === 'ghost') {
    const isBorder = targetRegion.x === 0 || targetRegion.x === 4 || targetRegion.y === 0 || targetRegion.y === 4;
    if (isBorder) {
      let pts = ownPawnsInSet;
      const jakub = jakubRegion?.pawns.jakub[0];
      if (dist <= (jakub ? jakub.range : 0)) pts -= 1;
      return pts;
    }
    return ownPawnsInSet + (dist > 2 ? 1 : -1);
  }
  return 0;
};

const socket = io('http://localhost:3001');

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [inputGameId, setInputGameId] = useState('');
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [activePawn, setActivePawn] = useState(null); 
  const [activeSet, setActiveSet] = useState(null); 
  const [activeGeneral, setActiveGeneral] = useState(null); 
  const [hoveredPawn, setHoveredPawn] = useState(null);
  const [validMoveTargets, setValidMoveTargets] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSetsPanelOpen, setIsSetsPanelOpen] = useState(true);

  const [isAutoplay, setIsAutoplay] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState(200);

  const jakubType = useMemo(() => PAWN_TYPES.find(p => p.id === 'jakub'), []);

  useEffect(() => {
    const handlePath = () => {
      const path = window.location.pathname;
      if (path === '/admin' || path === '/admin/') setIsAdmin(true);
      else {
        setIsAdmin(false);
        const match = path.match(/^\/game\/([^/]+)/);
        setGameId(match ? match[1] : null);
      }
      const params = new URLSearchParams(window.location.search);
      setPlayerId(params.get('player') ? parseInt(params.get('player')) : null);
    };
    handlePath();
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  useEffect(() => {
    if (!gameId || isAdmin) return;
    socket.emit('joinGame', gameId);
    fetchMap(gameId).then(d => { if (d && d.regions) setGameState(d); }).catch(console.error);
    const handleUpdate = (newData) => { if (newData && newData.regions) setGameState(prev => ({ ...prev, ...newData })); };
    socket.on('boardUpdate', handleUpdate);
    return () => socket.off('boardUpdate', handleUpdate);
  }, [gameId, isAdmin]);

  const updateGameWithSync = useCallback(async (newState) => {
    if (!gameId) return;
    setGameState(newState);
    try { await updateMap(gameId, newState); } catch (err) { console.error('Sync failed:', err); }
  }, [gameId]);

  const addLog = (state, text) => {
    state.history = [...(state.history || []), { time: getTime(), text }].slice(-100);
  };

  const counters = useMemo(() => {
    const breakdown = PAWN_TYPES.reduce((acc, pawn) => { acc[pawn.id] = 0; return acc; }, {});
    let total = 0;
    if (gameState.regions) {
      gameState.regions.forEach(region => {
        Object.entries(region.pawns).forEach(([typeId, instances]) => {
          if (breakdown[typeId] !== undefined && Array.isArray(instances)) {
            breakdown[typeId] += instances.length; total += instances.length;
          }
        });
      });
    }
    return { total, breakdown };
  }, [gameState.regions]);

  const availablePool = useMemo(() => {
    if (!gameState.sets || !gameState.sets.pawns) return {};
    const pool = { ...gameState.sets.pawns };
    Object.keys(pool).forEach(race => { pool[race] = Math.max(0, pool[race] - (counters.breakdown[race] || 0)); });
    return pool;
  }, [gameState.sets, counters.breakdown]);

  const isJakubOnBoard = useMemo(() => (counters.breakdown['jakub'] || 0) > 0, [counters.breakdown]);

  const jakubInstance = useMemo(() => {
    if (gameState.regions) {
      for (const region of gameState.regions) {
        if (region.pawns.jakub && region.pawns.jakub.length > 0) return region.pawns.jakub[0];
      }
    }
    return { ...jakubType.defaultParameters, statuses: [], isVirtual: true };
  }, [gameState.regions, jakubType]);

  const jakubRegion = useMemo(() => gameState.regions?.find(r => r.pawns.jakub && r.pawns.jakub.length > 0), [gameState.regions]);

  const refillSetsIfNeeded = (state) => {
    if (!state.sets.drawPile) state.sets.drawPile = [];
    if (!state.sets.discardPile) state.sets.discardPile = [];
    if (state.sets.drawPile.length === 0 && state.sets.discardPile.length > 0) {
      state.sets.drawPile = [...state.sets.discardPile];
      state.sets.discardPile = [];
      addLog(state, "Reshuffling discard pile into draw pile.");
    }
  };

  const drawSet = (state) => {
    refillSetsIfNeeded(state);
    if (state.sets.drawPile.length === 0) return null;
    const randomIdx = Math.floor(Math.random() * state.sets.drawPile.length);
    return state.sets.drawPile.splice(randomIdx, 1)[0];
  };

  const findAndRemoveSetById = (state, setId) => {
    let idx = (state.sets.drawPile || []).findIndex(s => s.id === setId);
    if (idx !== -1) return state.sets.drawPile.splice(idx, 1)[0];
    idx = (state.sets.heldSets || []).findIndex(s => s.id === setId);
    if (idx !== -1) return state.sets.heldSets.splice(idx, 1)[0];
    idx = (state.sets.discardPile || []).findIndex(s => s.id === setId);
    if (idx !== -1) return state.sets.discardPile.splice(idx, 1)[0];
    return null;
  };

  const handleAutoplayTick = useCallback(async () => {
    if (!isAutoplay || !gameId || gameState.gameStatus === 'finished') return;
    let workState = JSON.parse(JSON.stringify(gameState));
    
    // SETUP PHASE
    if (workState.phase === 'setup') {
      const activePlayerCount = workState.players.length;
      let distributionCount = 0;
      while (distributionCount < 3) {
        const poolSize = (workState.sets.drawPile?.length || 0) + (workState.sets.discardPile?.length || 0);
        if (poolSize >= activePlayerCount) {
          workState.players.forEach(player => {
            const set = drawSet(workState);
            if (set) {
              set.ownerId = player.id;
              if (!workState.sets.heldSets) workState.sets.heldSets = [];
              workState.sets.heldSets.push(set);
            }
          });
          distributionCount++;
        } else break;
      }
      if (distributionCount > 0) addLog(workState, `Round ${workState.currentRound}: Distributed ${distributionCount} sets to players.`);
      
      for (let i = 0; i < 2; i++) {
        const set = drawSet(workState);
        if (set) {
          set.ownerId = 'jakub';
          if (!workState.sets.heldSets) workState.sets.heldSets = [];
          workState.sets.heldSets.push(set);
          addLog(workState, `Jakub claimed Set ${set.id} from pool.`);
        }
      }

      workState.phase = 'player_phase';
      workState.currentPlayerIndex = 0;
      workState.passedPlayers = [];
      addLog(workState, `--- Start of Player Phase (Round ${workState.currentRound}) ---`);
      updateGameWithSync(workState);
      return;
    }

    // PLAYER PHASE
    if (workState.phase === 'player_phase') {
      const curId = workState.playerOrder[workState.currentPlayerIndex];
      const curPlayer = workState.players.find(p => p.id === curId);
      
      if (!curPlayer.generalOf) {
        const pick = workState.availableGenerals[0];
        curPlayer.generalOf = pick;
        workState.availableGenerals = workState.availableGenerals.filter(g => g !== pick);
        addLog(workState, `Player ${curId} chose General of ${pick}s`);
        workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
        updateGameWithSync(workState);
        return;
      }

      if (workState.passedPlayers.includes(curId)) {
        workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
        updateGameWithSync(workState);
        return;
      }

      const myHeld = (workState.sets.heldSets || []).filter(s => s.ownerId === curId);
      const emptyR = workState.regions.filter(r => !RACES.some(race => r.pawns[race]?.length > 0));
      
      const currentOnBoard = PAWN_TYPES.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
      workState.regions.forEach(r => Object.entries(r.pawns).forEach(([tId, insts]) => { if (currentOnBoard[tId] !== undefined) currentOnBoard[tId] += insts.length; }));
      const currentPool = { ...workState.sets.pawns };
      Object.keys(currentPool).forEach(r => currentPool[r] -= currentOnBoard[r]);

      let best = null;
      myHeld.forEach(set => {
        let isPlaceable = true;
        Object.entries(set.content).forEach(([tId, count]) => { if (currentPool[tId] < count) isPlaceable = false; });
        if (!isPlaceable) return;
        emptyR.forEach(region => {
          const pts = calculateSetPlacementPoints(curPlayer.generalOf, set.content, region, jakubRegion);
          if (!best || pts > best.pts) best = { set, region, pts };
        });
      });

      if (best && best.pts > 1) {
        const targetRegion = workState.regions[best.region.id];
        Object.entries(best.set.content).forEach(([tId, count]) => {
          if (!targetRegion.pawns[tId]) targetRegion.pawns[tId] = [];
          for (let i = 0; i < count; i++) {
            const pawnType = PAWN_TYPES.find(p => p.id === tId);
            targetRegion.pawns[tId].push({ statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) });
          }
        });
        curPlayer.points += best.pts;
        const usedSet = findAndRemoveSetById(workState, best.set.id);
        if (usedSet) { usedSet.ownerId = null; if (!workState.sets.discardPile) workState.sets.discardPile = []; workState.sets.discardPile.push(usedSet); }
        const raceCode = curPlayer.generalOf ? curPlayer.generalOf[0].toUpperCase() : '?';
        addLog(workState, `Player ${curId} (${raceCode}) placed Set ${best.set.id} (+${best.pts} pts)`);
      } else {
        workState.passedPlayers.push(curId);
        const currentHand = (workState.sets.heldSets || []).filter(s => s.ownerId === curId);
        if (currentHand.length > 2) {
          const excessCount = currentHand.length - 2;
          const sorted = [...currentHand].sort((a, b) => (a.content[curPlayer.generalOf] || 0) - (b.content[curPlayer.generalOf] || 0));
          const toDiscard = sorted.slice(0, excessCount);
          toDiscard.forEach(s => {
            const idx = workState.sets.heldSets.findIndex(h => h.id === s.id);
            if (idx !== -1) workState.sets.heldSets[idx].ownerId = 'jakub';
          });
          curPlayer.points += excessCount;
          addLog(workState, `Player ${curId} passed and sold ${excessCount} excess set(s) for ${excessCount} pts.`);
        } else {
          addLog(workState, `Player ${curId} passed.`);
        }
      }

      if (workState.passedPlayers.length === workState.players.length) {
        workState.phase = 'jakub_phase';
        workState.jakubAngerIncreased = false;
        addLog(workState, `--- Start of Jakub Phase ---`);
      } else {
        workState.currentPlayerIndex = (workState.currentPlayerIndex + 1) % workState.playerOrder.length;
      }
      updateGameWithSync(workState);
      return;
    }

    // JAKUB PHASE
    if (workState.phase === 'jakub_phase') {
      if (!workState.jakubAngerIncreased) {
        let jakub = null;
        for (const r of workState.regions) { if (r.pawns.jakub?.length > 0) { jakub = r.pawns.jakub[0]; break; } }
        if (jakub) {
          addLog(workState, `Jakub's current anger: V:${jakub.anger.vampire} W:${jakub.anger.werewolf} G:${jakub.anger.ghost} B:${jakub.anger.bardak}`);
          const jakubSets = (workState.sets.heldSets || []).filter(s => s.ownerId === 'jakub');
          jakubSets.forEach(s => {
            const result = applySetToJakubAnger(jakub, s.content);
            jakub.anger = result.anger;
            jakub.range = result.range;
            addLog(workState, `Jakub absorbed Set ${s.id}. New Anger: V:${jakub.anger.vampire} W:${jakub.anger.werewolf} G:${jakub.anger.ghost} B:${jakub.anger.bardak} | Range: ${jakub.range}`);
          });
          workState.jakubAngerIncreased = true;
          updateGameWithSync(workState);
          return;
        }
      }

      const step = executeJakubStep(workState);
      if (step.actionTaken) {
        addLog(step.newState, step.log);
        updateGameWithSync(step.newState);
      } else {
        addLog(workState, `Jakub stops his rampage.`);
        
        let jakub = null;
        for (const r of workState.regions) { if (r.pawns.jakub?.length > 0) { jakub = r.pawns.jakub[0]; break; } }
        if (jakub) {
          jakub.range = Math.max(1, jakub.range - 1);
          addLog(workState, `Jakub's range cooled down to ${jakub.range}.`);
        }

        const toDiscard = (workState.sets.heldSets || []).filter(s => s.ownerId === 'jakub');
        toDiscard.forEach(s => {
          s.ownerId = null;
          s.used = false;
          if (!workState.sets.discardPile) workState.sets.discardPile = [];
          workState.sets.discardPile.push(s);
        });
        workState.sets.heldSets = (workState.sets.heldSets || []).filter(s => s.ownerId !== 'jakub');

        workState.players.forEach(p => p.generalOf = null);
        workState.availableGenerals = [...RACES];
        workState.playerOrder = [...workState.players].sort((a, b) => a.points - b.points).map(p => p.id);
        
        if (workState.currentRound >= 6) {
          workState.phase = 'final_scoring';
          workState.currentPlayerIndex = 0;
          addLog(workState, `--- FINAL SCORING PHASE (06:00) ---`);
        } else {
          workState.currentRound += 1;
          workState.phase = 'setup';
          addLog(workState, `--- Round ${workState.currentRound} ---`);
        }
        updateGameWithSync(workState);
      }
      return;
    }

    // FINAL SCORING
    if (workState.phase === 'final_scoring') {
      const curIdx = workState.currentPlayerIndex;
      if (curIdx < workState.playerOrder.length) {
        const curId = workState.playerOrder[curIdx];
        const curPlayer = workState.players.find(p => p.id === curId);
        const pick = workState.availableGenerals[0];
        curPlayer.generalOf = pick;
        workState.availableGenerals = workState.availableGenerals.filter(g => g !== pick);
        
        let addedPoints = 0;
        if (pick === 'vampire') {
          let count = 0; workState.regions.forEach(r => count += (r.pawns[pick]?.length || 0));
          addedPoints = count * 2;
          addLog(workState, `Player ${curId} picked Vampires and gained ${addedPoints} points (2 per unit).`);
        } else if (pick === 'werewolf') {
          let count = 0; workState.regions.forEach(r => count += (r.pawns[pick]?.length || 0));
          addedPoints = count;
          addLog(workState, `Player ${curId} picked Werewolves and gained ${addedPoints} points (1 per unit).`);
        } else if (pick === 'ghost') {
          workState.regions.forEach(r => {
            const myCount = r.pawns[pick]?.length || 0;
            if (myCount > 0) {
              let othersCounts = RACES.filter(race => race !== pick).map(race => r.pawns[race]?.length || 0);
              const othersTotal = othersCounts.reduce((a, b) => a + b, 0);
              if (othersTotal === 0) addedPoints += 2;
              else {
                const maxOther = Math.max(...othersCounts);
                if (myCount > maxOther) addedPoints += 1;
              }
            }
          });
          addLog(workState, `Player ${curId} picked Ghosts and gained ${addedPoints} points (alone/plurality bonus).`);
        } else if (pick === 'bardak') {
          workState.regions.forEach(r => {
            const myCount = r.pawns[pick]?.length || 0;
            if (myCount > 0) {
              let othersTotal = 0;
              RACES.forEach(race => { if (race !== pick) othersTotal += (r.pawns[race]?.length || 0); });
              if (myCount > othersTotal) addedPoints += 2;
            }
          });
          addLog(workState, `Player ${curId} picked Bardaks and gained ${addedPoints} dominance points (2 per region).`);
        }
        
        curPlayer.points += addedPoints;
        workState.currentPlayerIndex += 1;
        updateGameWithSync(workState);
      } else {
        workState.gameStatus = 'finished';
        const winner = [...workState.players].sort((a,b)=>b.points-a.points)[0];
        addLog(workState, `GAME OVER! Winner: Player ${winner.id} with ${winner.points} points.`);
        setIsAutoplay(false);
        updateGameWithSync(workState);
      }
    }

  }, [isAutoplay, gameId, gameState, updateGameWithSync, jakubRegion]);

  useEffect(() => {
    const timer = setInterval(() => { if (isAutoplay) handleAutoplayTick(); }, autoplaySpeed);
    return () => clearInterval(timer);
  }, [isAutoplay, autoplaySpeed, handleAutoplayTick]);

  const handleBagMouseDown = useCallback((typeId, e) => {
    const pawnType = PAWN_TYPES.find(p => p.id === typeId);
    if (pawnType.isUnique && (counters.breakdown[typeId] || 0) > 0) return;
    if (availablePool[typeId] <= 0) return; 
    setActivePawn({ typeId, x: e.clientX, y: e.clientY, fromIndex: null });
    setValidMoveTargets(gameState.regions.map(r => r.id));
  }, [gameState.regions, counters.breakdown, availablePool]);

  const handleJakubMouseDownFromPanel = useCallback((e) => {
    if (isJakubOnBoard) return;
    setActivePawn({ typeId: 'jakub', x: e.clientX, y: e.clientY, fromIndex: null });
    setValidMoveTargets(gameState.regions.map(r => r.id));
  }, [isJakubOnBoard, gameState.regions]);

  const handleSetMouseDown = useCallback((set, e) => {
    setActiveSet({ set, x: e.clientX, y: e.clientY });
    const validIndices = gameState.regions.filter(r => !RACES.some(race => r.pawns[race]?.length > 0)).map(r => r.id);
    setValidMoveTargets(validIndices);
  }, [gameState.regions]);

  const handleGeneralMouseDown = useCallback((race, e) => {
    if (playerId) return; setActiveGeneral({ race, x: e.clientX, y: e.clientY });
  }, [playerId]);

  const handlePawnMouseDown = useCallback((typeId, regionIndex, pawnInstanceIndex, e) => {
    const instances = gameState.regions[regionIndex].pawns[typeId];
    const pawn = instances[pawnInstanceIndex];
    if (pawn.statuses.includes(STATUSES.ENABLED)) {
      if (typeId === 'jakub' && pawn.range <= 0) return;
      setActivePawn({ typeId, x: e.clientX, y: e.clientY, fromIndex: regionIndex, pawnInstanceIndex });
      setHoveredPawn(null);
      const speed = typeId === 'jakub' ? pawn.speed : PAWN_TYPES.find(p => p.id === typeId).speed;
      setValidMoveTargets(getReachableRegions(gameState.regions, regionIndex, speed));
    }
  }, [gameState.regions]);

  useEffect(() => {
    const handleMouseMove = (e) => { 
      if (activePawn) setActivePawn(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
      if (activeSet) setActiveSet(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
      if (activeGeneral) setActiveGeneral(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
    };
    const handleGlobalMouseUp = () => { setActivePawn(null); setActiveSet(null); setActiveGeneral(null); setValidMoveTargets([]); };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleGlobalMouseUp); };
  }, [activePawn, activeSet, activeGeneral]);

  const handleRegionMouseUp = useCallback((toIndex, e) => {
    if (!gameId) return;
    const newState = JSON.parse(JSON.stringify(gameState));
    if (activePawn) {
      e.stopPropagation();
      const { typeId, fromIndex, pawnInstanceIndex } = activePawn;
      if (!validMoveTargets.includes(toIndex)) { setActivePawn(null); setValidMoveTargets([]); return; }
      if (fromIndex !== null) {
        const [movedPawn] = newState.regions[fromIndex].pawns[typeId].splice(pawnInstanceIndex, 1);
        if (newState.regions[fromIndex].pawns[typeId].length === 0) delete newState.regions[fromIndex].pawns[typeId];
        if (typeId === 'jakub') movedPawn.range = Math.max(0, movedPawn.range - 1);
        if (!newState.regions[toIndex].pawns[typeId]) newState.regions[toIndex].pawns[typeId] = [];
        newState.regions[toIndex].pawns[typeId].push(movedPawn);
      } else {
        if (typeId !== 'jakub' && availablePool[typeId] <= 0) { setActivePawn(null); setValidMoveTargets([]); return; }
        const pawnType = PAWN_TYPES.find(p => p.id === typeId);
        const newPawn = { statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) };
        if (!newState.regions[toIndex].pawns[typeId]) newState.regions[toIndex].pawns[typeId] = [];
        newState.regions[toIndex].pawns[typeId].push(newPawn);
      }
      updateGameWithSync(newState);
      setActivePawn(null);
      setValidMoveTargets([]);
    }
    if (activeSet) {
      e.stopPropagation();
      if (!validMoveTargets.includes(toIndex)) { setActiveSet(null); setValidMoveTargets([]); return; }
      let canPlace = true;
      Object.entries(activeSet.set.content).forEach(([tId, count]) => { if (availablePool[tId] < count) canPlace = false; });
      if (!canPlace) { alert("Not enough pawns."); setActiveSet(null); setValidMoveTargets([]); return; }
      const targetRegion = newState.regions[toIndex];
      const setOwner = newState.players.find(p => p.id === activeSet.set.ownerId);
      if (setOwner && setOwner.generalOf) {
        const points = calculateSetPlacementPoints(setOwner.generalOf, activeSet.set.content, targetRegion, jakubRegion);
        const pIdx = newState.players.findIndex(p => p.id === setOwner.id);
        newState.players[pIdx].points += points;
        const raceCode = setOwner.generalOf[0].toUpperCase();
        addLog(newState, `Player ${setOwner.id} (${raceCode}) placed Set ${activeSet.set.id} at [${targetRegion.x},${targetRegion.y}] for ${points} pts`);
      }
      Object.entries(activeSet.set.content).forEach(([tId, count]) => {
        if (!targetRegion.pawns[tId]) targetRegion.pawns[tId] = [];
        for (let i = 0; i < count; i++) {
          const pawnType = PAWN_TYPES.find(p => p.id === tId);
          targetRegion.pawns[tId].push({ statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) });
        }
      });
      
      const usedSet = findAndRemoveSetById(newState, activeSet.set.id);
      if (usedSet) { usedSet.ownerId = null; usedSet.used = false; if (!newState.sets.discardPile) newState.sets.discardPile = []; newState.sets.discardPile.push(usedSet); }
      updateGameWithSync(newState);
      setActiveSet(null);
      setValidMoveTargets([]);
    }
  }, [activePawn, activeSet, gameState, gameId, validMoveTargets, jakubRegion, availablePool, updateGameWithSync]);

  const handlePlayerMouseUp = useCallback((targetPlayerId) => {
    if (activeSet && !playerId) { 
      const newState = JSON.parse(JSON.stringify(gameState));
      const s = findAndRemoveSetById(newState, activeSet.set.id);
      if (s) { s.ownerId = targetPlayerId; if (!newState.sets.heldSets) newState.sets.heldSets = []; newState.sets.heldSets.push(s); addLog(newState, `Manual: Distributed Set ${s.id} to Player ${targetPlayerId}`); updateGameWithSync(newState); }
      setActiveSet(null);
    }
    if (activeGeneral && !playerId) { 
      const newState = JSON.parse(JSON.stringify(gameState));
      const playerIdx = newState.players.findIndex(p => p.id === targetPlayerId);
      if (playerIdx !== -1) {
        const oldRace = newState.players[playerIdx].generalOf;
        if (oldRace) newState.availableGenerals.push(oldRace);
        newState.players[playerIdx].generalOf = activeGeneral.race;
        newState.availableGenerals = newState.availableGenerals.filter(r => r !== activeGeneral.race);
        updateGameWithSync(newState);
      }
      setActiveGeneral(null);
    }
  }, [activeSet, activeGeneral, gameState, playerId, updateGameWithSync]);

  const handleUpdatePoints = useCallback((playerIndex, delta) => {
    const newState = JSON.parse(JSON.stringify(gameState));
    newState.players[playerIndex].points = Math.max(0, newState.players[playerIndex].points + delta);
    updateGameWithSync(newState);
  }, [gameState, updateGameWithSync]);

  const handleRegionRemove = useCallback((index, typeId) => {
    if (!gameId) return;
    const newState = JSON.parse(JSON.stringify(gameState));
    if (newState.regions[index].pawns[typeId] && newState.regions[index].pawns[typeId].length > 0) {
      newState.regions[index].pawns[typeId].pop();
      if (newState.regions[index].pawns[typeId].length === 0) delete newState.regions[index].pawns[typeId];
      updateGameWithSync(newState); setHoveredPawn(null);
    }
  }, [gameState, gameId, updateGameWithSync]);

  const handleRegionAdd = useCallback((index, typeId) => {
    if (!gameId) return;
    const pawnType = PAWN_TYPES.find(p => p.id === typeId);
    if (!pawnType || (pawnType.isUnique && (counters.breakdown[typeId] || 0) > 0)) return;
    if (availablePool[typeId] <= 0) return;
    const newState = JSON.parse(JSON.stringify(gameState));
    const newPawn = { statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) };
    if (!newState.regions[index].pawns[typeId]) newState.regions[index].pawns[typeId] = [];
    newState.regions[index].pawns[typeId].push(newPawn);
    updateGameWithSync(newState);
  }, [gameState, gameId, counters.breakdown, availablePool, updateGameWithSync]);

  const handleJakubCounterUpdate = useCallback((path, delta) => {
    if (!gameId) return;
    const newState = JSON.parse(JSON.stringify(gameState));
    let target = null;
    for (const region of newState.regions) { if (region.pawns.jakub && region.pawns.jakub.length > 0) { target = region.pawns.jakub[0]; break; } }
    if (!target) return;
    let curr = target;
    for (let i = 0; i < path.length - 1; i++) curr = curr[path[i]];
    curr[path[path.length - 1]] = Math.max(0, curr[path[path.length - 1]] + delta);
    updateGameWithSync(newState);
  }, [gameState.regions, gameId, updateGameWithSync]);

  const handleResetBoard = useCallback(async () => {
    if (gameId && window.confirm('Reset game?')) {
      try { const serverData = await resetMap(gameId); if (serverData && serverData.regions) setGameState(serverData); setIsMenuOpen(false); } catch (err) { alert('Reset failed'); }
    }
  }, [gameId]);

  const filteredSets = gameState.sets ? (playerId ? (gameState.sets.heldSets || []).filter(s => s.ownerId === playerId) : (gameState.sets.drawPile || [])) : [];
  const jakubsSets = gameState.sets ? (gameState.sets.heldSets || []).filter(s => s.ownerId === 'jakub') : [];

  if (isAdmin) return <AdminPanel />;
  if (!gameId) return <LandingPage inputGameId={inputGameId} setInputGameId={setInputGameId} onGoToGame={(e) => { e.preventDefault(); if (inputGameId.trim()) { window.location.href = `/game/${inputGameId.trim()}`; } }} />;

  return (
    <div className="app-container">
      <div className="top-header-bar">
        <button className="menu-toggle-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}><div className="hamburger-icon"><span></span><span></span><span></span></div></button>
        <div className="game-id-info">
          Game ID: <strong>{gameId}</strong> 
          <span className="phase-indicator">{gameState.phase}</span>
          <span className="round-indicator">R:{gameState.currentRound}/6</span>
        </div>
        
        <div className="autoplay-controls">
          <button className={`autoplay-btn ${isAutoplay ? 'active' : ''}`} onClick={() => setIsAutoplay(!isAutoplay)}>
            {isAutoplay ? 'PAUSE' : 'AUTOPLAY'}
          </button>
          <div className="speed-control">
            <span className="speed-label">{autoplaySpeed}ms</span>
            <input type="range" min="100" max="1500" step="50" value={autoplaySpeed} onChange={(e) => setAutoplaySpeed(parseInt(e.target.value))} />
          </div>
        </div>

        <div className="header-actions">
          <button className={`sets-toggle-btn ${isSetsPanelOpen ? 'active' : ''}`} onClick={() => setIsSetsPanelOpen(!isSetsPanelOpen)}>SETS</button>
        </div>
        {isMenuOpen && (
          <><div className="menu-backdrop" onClick={() => setIsMenuOpen(false)}></div><div className="dropdown-menu">
            <button className="menu-item" onClick={() => { const dataStr = JSON.stringify(gameState, null, 2); const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr); const link = document.createElement('a'); link.href = dataUri; link.download = `game_${gameId}.json`; link.click(); }}>Download Board</button>
            <label className="menu-item">Upload Board<input type="file" accept=".json" onChange={(e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (ev) => { try { const data = JSON.parse(ev.target.result); if (data && data.regions) await updateGameWithSync(data); } catch (err) { alert('Failed'); } }; reader.readAsText(file); setIsMenuOpen(false); }} style={{ display: 'none' }} /></label>
            <button className="menu-item reset" onClick={handleResetBoard}>Reset Game</button>
            <button className="menu-item" onClick={() => { window.history.pushState({}, '', '/'); setGameId(null); setGameState(INITIAL_STATE); setIsAdmin(false); window.dispatchEvent(new Event('popstate')); }}>Change Game</button>
            <button className="menu-item" onClick={() => { window.history.pushState({}, '', '/admin'); setIsAdmin(true); setGameId(null); setIsMenuOpen(false); window.dispatchEvent(new Event('popstate')); }}>Admin Panel</button>

          </div></>
        )}
      </div>

      <div className="game-layout-wrapper">
        <div className="left-controls">
          <div className="bags-container">
            {PAWN_TYPES.filter(p => !p.isUnique).map(pawn => (
              <Bag key={pawn.id} type={pawn} onMouseDown={(e) => handleBagMouseDown(pawn.id, e)} availableCount={availablePool[pawn.id]} />
            ))}
          </div>
          <div className="jakub-management">
            <JakubPanel jakub={jakubInstance} onUpdateCounter={handleJakubCounterUpdate} onJakubMouseDown={handleJakubMouseDownFromPanel} isJakubOnBoard={isJakubOnBoard} />
            <div className="jakubs-sets">
              <SetsPanel sets={jakubsSets} title="SETS" onSetMouseDown={() => {}} />
            </div>
          </div>
        </div>
        <div className="main-game-area">
          {gameState.regions && <Board regions={gameState.regions} onRegionMouseUp={handleRegionMouseUp} onRemovePawn={handleRegionRemove} onAddPawn={handleRegionAdd} onPawnMouseDown={handlePawnMouseDown} setHoveredPawn={setHoveredPawn} validMoveTargets={validMoveTargets} />}
          <GameHeader counters={counters} maxPool={gameState.sets?.pawns || {}} />
          <PointsTracker players={gameState.players || []} onUpdatePoints={handleUpdatePoints} currentPlayerId={playerId} onPlayerMouseUp={handlePlayerMouseUp} sets={gameState.sets} />
          {gameState.phase === 'player_phase' && gameState.availableGenerals.length > 0 && (
            <div className="generals-pool-horizontal">
              {gameState.availableGenerals.map(race => (
                <div key={race} className={`general-icon large ${race}`} onMouseDown={(e) => handleGeneralMouseDown(race, e)}></div>
              ))}
            </div>
          )}
        </div>
        <div className="right-controls">
          {isSetsPanelOpen && (
            <div className="sidebar-sets-container">
              <SetsPanel 
                sets={filteredSets} 
                onSetMouseDown={handleSetMouseDown} 
                title={playerId ? "Your Sets" : "Draw Pile"} 
                setInfo={gameState.sets}
                discardPileCount={gameState.sets?.discardPile?.length || 0}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bottom-history-container">
        <HistoryPanel logs={gameState.history || []} />
      </div>
      
      {activePawn && <PawnGhost type={PAWN_TYPES.find(p => p.id === activePawn.typeId)} x={activePawn.x} y={activePawn.y} />}
      {activeSet && <div className="set-ghost" style={{ left: activeSet.x, top: activeSet.y }}><div className="set-ghost-badge">Set {activeSet.set.id}</div></div>}
      {activeGeneral && <div className="general-ghost" style={{ left: activeGeneral.x, top: activeGeneral.y }}><div className={`general-icon large ${activeGeneral.race}`}></div></div>}
      {hoveredPawn && !activePawn && !activeSet && !activeGeneral && <PawnStatusPopup pawn={hoveredPawn.pawn} pawnType={hoveredPawn.pawnType} position={{ x: hoveredPawn.x, y: hoveredPawn.y }} />}
    </div>
  );
}

export default App;
