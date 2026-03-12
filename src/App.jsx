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
import PawnStatusPopup from './components/PawnStatusPopup';
import { fetchMap, updateMap, resetMap } from './services/api';
import { io } from 'socket.io-client';
import { PAWN_TYPES, STATUSES } from './constants/pawnTypes';

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
  players: [],
  sets: { pawns: { bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, items: [] },
  phase: 'setup',
  availableGenerals: [...RACES]
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
  return Math.abs(r1.x - r2.x) + Math.abs(r1.y - r2.y);
};

const calculateSetPlacementPoints = (race, setContent, targetRegion, jakubRegion) => {
  const dist = jakubRegion ? getManhattanDistance(targetRegion, jakubRegion) : 999;
  const ownPawnsInSet = setContent[race] || 0;
  if (race === 'vampire') return ownPawnsInSet + (2 - dist);
  if (race === 'werewolf') return (dist <= 2) ? (ownPawnsInSet + 1) : 0;
  if (race === 'bardak') return Object.values(setContent).reduce((a, b) => a + b, 0);
  if (race === 'ghost') return ownPawnsInSet + (dist <= 2 ? -1 : 1);
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

  const jakubType = useMemo(() => PAWN_TYPES.find(p => p.id === 'jakub'), []);

  useEffect(() => {
    const handlePath = () => {
      const path = window.location.pathname;
      if (path === '/admin' || path === '/admin/') {
        setIsAdmin(true);
        setGameId(null);
      } else {
        setIsAdmin(false);
        const match = path.match(/^\/game\/([^/]+)/);
        setGameId(match ? match[1] : null);
      }
      const params = new URLSearchParams(window.location.search);
      const pId = params.get('player');
      setPlayerId(pId ? parseInt(pId) : null);
    };
    handlePath();
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  useEffect(() => {
    if (!gameId || isAdmin) return;
    socket.emit('joinGame', gameId);
    fetchMap(gameId)
      .then(serverData => { if (serverData && serverData.regions) setGameState(serverData); })
      .catch(err => console.error('Failed to load:', err));
    const handleUpdate = (newData) => { if (newData) setGameState(prev => ({ ...prev, ...newData })); };
    socket.on('boardUpdate', handleUpdate);
    return () => socket.off('boardUpdate', handleUpdate);
  }, [gameId, isAdmin]);

  const updateGameWithSync = useCallback(async (newState) => {
    if (!gameId) return;
    setGameState(newState);
    try { await updateMap(gameId, newState); } catch (err) { console.error('Sync failed:', err); }
  }, [gameId]);

  const counters = useMemo(() => {
    const breakdown = PAWN_TYPES.reduce((acc, pawn) => { acc[pawn.id] = 0; return acc; }, {});
    let total = 0;
    gameState.regions.forEach(region => {
      Object.entries(region.pawns).forEach(([typeId, instances]) => {
        if (breakdown[typeId] !== undefined && Array.isArray(instances)) {
          breakdown[typeId] += instances.length; total += instances.length;
        }
      });
    });
    return { total, breakdown };
  }, [gameState.regions]);

  const jakubInstance = useMemo(() => {
    for (const region of gameState.regions) {
      if (region.pawns.jakub && region.pawns.jakub.length > 0) return region.pawns.jakub[0];
    }
    return { ...jakubType.defaultParameters, statuses: [], isVirtual: true };
  }, [gameState.regions, jakubType]);

  const jakubRegion = useMemo(() => {
    return gameState.regions.find(r => r.pawns.jakub && r.pawns.jakub.length > 0);
  }, [gameState.regions]);

  const handleBagMouseDown = useCallback((typeId, e) => {
    const pawnType = PAWN_TYPES.find(p => p.id === typeId);
    if (pawnType.isUnique && counters.breakdown[typeId] > 0) return;
    setActivePawn({ typeId, x: e.clientX, y: e.clientY, fromIndex: null });
    setValidMoveTargets(gameState.regions.map(r => r.id));
  }, [gameState.regions, counters.breakdown]);

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
    if (activePawn) {
      e.stopPropagation();
      const { typeId, fromIndex, pawnInstanceIndex } = activePawn;
      if (!validMoveTargets.includes(toIndex)) { setActivePawn(null); setValidMoveTargets([]); return; }
      const newState = JSON.parse(JSON.stringify(gameState));
      if (fromIndex !== null) {
        const [movedPawn] = newState.regions[fromIndex].pawns[typeId].splice(pawnInstanceIndex, 1);
        if (newState.regions[fromIndex].pawns[typeId].length === 0) delete newState.regions[fromIndex].pawns[typeId];
        if (typeId === 'jakub') movedPawn.range = Math.max(0, movedPawn.range - 1);
        if (!newState.regions[toIndex].pawns[typeId]) newState.regions[toIndex].pawns[typeId] = [];
        newState.regions[toIndex].pawns[typeId].push(movedPawn);
      } else {
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
      const newState = JSON.parse(JSON.stringify(gameState));
      const targetRegion = newState.regions[toIndex];
      const setOwner = newState.players.find(p => p.id === activeSet.set.ownerId);
      if (setOwner && setOwner.generalOf) {
        const points = calculateSetPlacementPoints(setOwner.generalOf, activeSet.set.content, targetRegion, jakubRegion);
        const playerIdx = newState.players.findIndex(p => p.id === setOwner.id);
        newState.players[playerIdx].points += points;
      }
      Object.entries(activeSet.set.content).forEach(([typeId, count]) => {
        if (!targetRegion.pawns[typeId]) targetRegion.pawns[typeId] = [];
        for (let i = 0; i < count; i++) {
          const pawnType = PAWN_TYPES.find(p => p.id === typeId);
          targetRegion.pawns[typeId].push({ statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) });
        }
      });
      const setIdx = newState.sets.items.findIndex(s => s.id === activeSet.set.id);
      if (setIdx !== -1) { newState.sets.items[setIdx].used = true; newState.sets.items[setIdx].ownerId = null; }
      updateGameWithSync(newState);
      setActiveSet(null);
      setValidMoveTargets([]);
    }
  }, [activePawn, activeSet, gameState, gameId, validMoveTargets, jakubRegion, updateGameWithSync]);

  const handlePlayerMouseUp = useCallback((targetPlayerId) => {
    if (activeSet && !playerId) { 
      const newState = JSON.parse(JSON.stringify(gameState));
      const setIdx = newState.sets.items.findIndex(s => s.id === activeSet.set.id);
      if (setIdx !== -1) { newState.sets.items[setIdx].ownerId = targetPlayerId; updateGameWithSync(newState); }
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

  const handleDistributeGenerals = useCallback(async () => {
    const newState = JSON.parse(JSON.stringify(gameState));
    const shuffledRaces = [...RACES].sort(() => Math.random() - 0.5);
    newState.players.forEach((player, i) => { player.generalOf = shuffledRaces[i]; });
    newState.availableGenerals = [];
    await updateGameWithSync(newState);
  }, [gameState, updateGameWithSync]);

  const handleDistributeSets = useCallback(async () => {
    const newState = JSON.parse(JSON.stringify(gameState));
    const globalSets = newState.sets.items.filter(s => s.ownerId === null && !s.used);
    if (globalSets.length < 4) { alert("Not enough global sets."); return; }
    const setsPerPlayer = Math.min(5, Math.floor(globalSets.length / 4));
    newState.players.forEach(player => {
      for (let i = 0; i < setsPerPlayer; i++) {
        const randomIdx = Math.floor(Math.random() * globalSets.length);
        const set = globalSets.splice(randomIdx, 1)[0];
        const originalSetIdx = newState.sets.items.findIndex(s => s.id === set.id);
        newState.sets.items[originalSetIdx].ownerId = player.id;
      }
    });
    await updateGameWithSync(newState);
  }, [gameState, updateGameWithSync]);

  const handleSimulatePlacements = useCallback(async () => {
    const workState = JSON.parse(JSON.stringify(gameState));
    const passedPlayers = new Set();
    while (true) {
      const activePlayers = workState.players.filter(p => !passedPlayers.has(p.id));
      if (activePlayers.length === 0) break;
      const sortedActive = [...activePlayers].sort((a, b) => a.points - b.points || a.id - b.id);
      const currentPlayer = sortedActive[0];
      const playerIdx = workState.players.findIndex(p => p.id === currentPlayer.id);
      const mySets = workState.sets.items.filter(s => s.ownerId === currentPlayer.id && !s.used);
      const emptyRegions = workState.regions.filter(r => !RACES.some(race => r.pawns[race]?.length > 0));
      if (mySets.length === 0 || emptyRegions.length === 0) { passedPlayers.add(currentPlayer.id); continue; }
      let bestMove = null;
      mySets.forEach(set => {
        emptyRegions.forEach(region => {
          const pts = calculateSetPlacementPoints(currentPlayer.generalOf, set.content, region, jakubRegion);
          if (!bestMove || pts > bestMove.pts) { bestMove = { set, region, pts }; }
        });
      });
      if (bestMove && !(bestMove.pts <= 0 && mySets.length <= 2)) {
        const targetRegion = workState.regions[bestMove.region.id];
        Object.entries(bestMove.set.content).forEach(([typeId, count]) => {
          if (!targetRegion.pawns[typeId]) targetRegion.pawns[typeId] = [];
          for (let i = 0; i < count; i++) {
            const pawnType = PAWN_TYPES.find(p => p.id === typeId);
            targetRegion.pawns[typeId].push({ statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) });
          }
        });
        workState.players[playerIdx].points += bestMove.pts;
        const setIdx = workState.sets.items.findIndex(s => s.id === bestMove.set.id);
        workState.sets.items[setIdx].used = true; workState.sets.items[setIdx].ownerId = null;
        continue;
      }
      passedPlayers.add(currentPlayer.id);
    }
    await updateGameWithSync(workState);
  }, [gameState, jakubRegion, updateGameWithSync]);

  const handlePhaseTransition = useCallback(async (newPhase) => {
    const newState = JSON.parse(JSON.stringify(gameState));
    newState.phase = newPhase;
    await updateGameWithSync(newState);
  }, [gameState, updateGameWithSync]);

  const handleResetBoard = useCallback(async () => {
    if (gameId && window.confirm('Reset game?')) {
      try { const serverData = await resetMap(gameId); if (serverData && serverData.regions) setGameState(serverData); setIsMenuOpen(false); } catch (err) { alert('Reset failed'); }
    }
  }, [gameId]);

  if (isAdmin) return <AdminPanel />;
  if (!gameId) return <LandingPage inputGameId={inputGameId} setInputGameId={setInputGameId} onGoToGame={(e) => { e.preventDefault(); if (inputGameId.trim()) { window.location.href = `/game/${inputGameId.trim()}`; } }} />;

  const filteredSets = gameState.sets ? (playerId ? gameState.sets.items.filter(s => s.ownerId === playerId) : gameState.sets.items.filter(s => s.ownerId === null)) : [];
  const allPlayersAssigned = gameState.players && gameState.players.length === 4 && gameState.players.every(p => p.generalOf !== null);

  return (
    <div className="app-container">
      <div className="top-header-bar">
        <button className="menu-toggle-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}><div className="hamburger-icon"><span></span><span></span><span></span></div></button>
        <div className="game-id-info">
          Game ID: <strong>{gameId}</strong> 
          <span className="phase-indicator">{gameState.phase}</span>
          {gameState.setName && <span className="set-name-indicator">Set: {gameState.setName}</span>}
        </div>
        <div className="header-actions">
          {gameState.phase === 'setup' && (
            <>
              <button className="action-button download-btn" onClick={handleDistributeGenerals}>Assign Generals</button>
              <button className="action-button upload-btn" onClick={handleDistributeSets}>Distribute Sets</button>
              <button className="action-button" style={{ backgroundColor: '#d35400' }} onClick={handleSimulatePlacements}>Auto Setup</button>
              <button className="action-button next-btn" onClick={() => handlePhaseTransition('player_phase')}>Go to Player Phase</button>
            </>
          )}
          {gameState.phase === 'player_phase' && <button className="action-button next-btn" onClick={() => handlePhaseTransition('jakub_phase')}>Finish Player Phase</button>}
          {gameState.phase === 'jakub_phase' && <button className="action-button reset-btn" onClick={() => handlePhaseTransition('setup')}>Finish Jakub Phase</button>}
          <button className={`sets-toggle-btn ${isSetsPanelOpen ? 'active' : ''}`} onClick={() => setIsSetsPanelOpen(!isSetsPanelOpen)}>SETS</button>
        </div>
        {isMenuOpen && (
          <>
            <div className="menu-backdrop" onClick={() => setIsMenuOpen(false)}></div>
            <div className="dropdown-menu">
              <button className="menu-item" onClick={() => { const dataStr = JSON.stringify(gameState, null, 2); const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr); const link = document.createElement('a'); link.href = dataUri; link.download = `game_${gameId}.json`; link.click(); }}>Download Board</button>
              <label className="menu-item">Upload Board<input type="file" accept=".json" onChange={(e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (ev) => { try { const data = JSON.parse(ev.target.result); if (data && data.regions) await updateGameWithSync(data); } catch (err) { alert('Failed'); } }; reader.readAsText(file); setIsMenuOpen(false); }} style={{ display: 'none' }} /></label>
              <button className="menu-item reset" onClick={handleResetBoard}>Reset Game</button>
              <button className="menu-item" onClick={() => { window.history.pushState({}, '', '/'); setGameId(null); setGameState(INITIAL_STATE); setIsAdmin(false); }}>Change Game</button>
              <button className="menu-item" onClick={() => { window.history.pushState({}, '', '/admin'); setIsAdmin(true); setGameId(null); setIsMenuOpen(false); }}>Admin Panel</button>
            </div>
          </>
        )}
      </div>

      <div className="game-layout-wrapper">
        <div className="left-controls">
          {gameState.phase === 'setup' && gameState.availableGenerals && (
            <div className="generals-pool">
              <h4>General Pool</h4>
              <div className="generals-list">
                {gameState.availableGenerals.map(race => (
                  <div key={race} className={`general-icon large ${race}`} onMouseDown={(e) => handleGeneralMouseDown(race, e)}></div>
                ))}
              </div>
            </div>
          )}
          <div className="bags-container">
            {PAWN_TYPES.map(pawn => (
              <Bag key={pawn.id} type={pawn} onMouseDown={(e) => handleBagMouseDown(pawn.id, e)} disabled={pawn.isUnique && counters.breakdown[pawn.id] > 0} />
            ))}
          </div>
        </div>
        <div className="main-game-area">
          <PointsTracker players={gameState.players} onUpdatePoints={handleUpdatePoints} currentPlayerId={playerId} onPlayerMouseUp={handlePlayerMouseUp} sets={gameState.sets} />
          <Board regions={gameState.regions} onRegionMouseUp={handleRegionMouseUp} onRemovePawn={handleRegionRemove} onAddPawn={handleRegionAdd} onPawnMouseDown={handlePawnMouseDown} setHoveredPawn={setHoveredPawn} validMoveTargets={validMoveTargets} />
          <GameHeader counters={counters} />
        </div>
        <div className="right-controls">
          <JakubPanel jakub={jakubInstance} onUpdateCounter={handleJakubCounterUpdate} />
          {isSetsPanelOpen && <SetsPanel sets={filteredSets} onSetMouseDown={handleSetMouseDown} title={playerId ? "Your Sets" : "Global Sets"} />}
        </div>
      </div>
      
      {activePawn && <PawnGhost type={PAWN_TYPES.find(p => p.id === activePawn.typeId)} x={activePawn.x} y={activePawn.y} />}
      {activeSet && <div className="set-ghost" style={{ left: activeSet.x, top: activeSet.y }}><div className="set-ghost-badge">Set {activeSet.set.id}</div></div>}
      {activeGeneral && <div className="general-ghost" style={{ left: activeGeneral.x, top: activeGeneral.y }}><div className={`general-icon large ${activeGeneral.race}`}></div></div>}
      {hoveredPawn && !activePawn && !activeSet && !activeGeneral && <PawnStatusPopup pawn={hoveredPawn.pawn} pawnType={hoveredPawn.pawnType} position={{ x: hoveredPawn.x, y: hoveredPawn.y }} />}
    </div>
  );
}

export default App;
