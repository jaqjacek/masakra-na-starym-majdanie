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

const INITIAL_STATE = {
  regions: createEmptyBoard(),
  players: [{ id: 1, name: '', points: 10 }, { id: 2, name: '', points: 10 }, { id: 3, name: '', points: 10 }, { id: 4, name: '', points: 10 }],
  sets: { pawns: { bardak: 80, ghost: 30, werewolf: 20, vampire: 10 }, items: [] }
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

const socket = io('http://localhost:3001');

function App() {
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [inputGameId, setInputGameId] = useState('');
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [activePawn, setActivePawn] = useState(null); 
  const [activeSet, setActiveSet] = useState(null); 
  const [hoveredPawn, setHoveredPawn] = useState(null);
  const [validMoveTargets, setValidMoveTargets] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSetsPanelOpen, setIsSetsPanelOpen] = useState(true);

  const jakubType = useMemo(() => PAWN_TYPES.find(p => p.id === 'jakub'), []);

  useEffect(() => {
    const handlePath = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/game\/([^/]+)/);
      setGameId(match ? match[1] : null);
      const params = new URLSearchParams(window.location.search);
      const pId = params.get('player');
      setPlayerId(pId ? parseInt(pId) : null);
    };
    handlePath();
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  useEffect(() => {
    if (!gameId) return;
    socket.emit('joinGame', gameId);
    fetchMap(gameId)
      .then(serverData => { if (serverData && serverData.regions) setGameState(serverData); })
      .catch(err => console.error('Failed to load:', err));
    const handleUpdate = (newData) => { if (newData) setGameState(prev => ({ ...prev, ...newData })); };
    socket.on('boardUpdate', handleUpdate);
    return () => socket.off('boardUpdate', handleUpdate);
  }, [gameId]);

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

  const handleBagMouseDown = useCallback((typeId, e) => {
    const pawnType = PAWN_TYPES.find(p => p.id === typeId);
    if (pawnType.isUnique && counters.breakdown[typeId] > 0) return;
    setActivePawn({ typeId, x: e.clientX, y: e.clientY, fromIndex: null });
    setValidMoveTargets(gameState.regions.map(r => r.id));
  }, [gameState.regions, counters.breakdown]);

  const handleSetMouseDown = useCallback((set, e) => {
    setActiveSet({ set, x: e.clientX, y: e.clientY });
    setValidMoveTargets(gameState.regions.map(r => r.id));
  }, [gameState.regions]);

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
    };
    const handleGlobalMouseUp = () => { setActivePawn(null); setActiveSet(null); setValidMoveTargets([]); };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleGlobalMouseUp); };
  }, [activePawn, activeSet]);

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
      const newState = JSON.parse(JSON.stringify(gameState));
      const targetRegion = newState.regions[toIndex];
      Object.entries(activeSet.set.content).forEach(([typeId, count]) => {
        if (!targetRegion.pawns[typeId]) targetRegion.pawns[typeId] = [];
        for (let i = 0; i < count; i++) {
          const pawnType = PAWN_TYPES.find(p => p.id === typeId);
          targetRegion.pawns[typeId].push({ statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) });
        }
      });
      const setIdx = newState.sets.items.findIndex(s => s.id === activeSet.set.id);
      if (setIdx !== -1) newState.sets.items[setIdx].used = true;
      updateGameWithSync(newState);
      setActiveSet(null);
      setValidMoveTargets([]);
    }
  }, [activePawn, activeSet, gameState, gameId, validMoveTargets, updateGameWithSync]);

  const handlePlayerMouseUp = useCallback((targetPlayerId) => {
    if (activeSet && !playerId) { // Only spectators (admins) can distribute sets
      const newState = JSON.parse(JSON.stringify(gameState));
      const setIdx = newState.sets.items.findIndex(s => s.id === activeSet.set.id);
      if (setIdx !== -1) {
        newState.sets.items[setIdx].ownerId = targetPlayerId;
        updateGameWithSync(newState);
      }
      setActiveSet(null);
    }
  }, [activeSet, gameState, playerId, updateGameWithSync]);

  const handleRegionRemove = useCallback((index, typeId) => {
    if (!gameId) return;
    const newState = JSON.parse(JSON.stringify(gameState));
    if (newState.regions[index].pawns[typeId] && newState.regions[index].pawns[typeId].length > 0) {
      newState.regions[index].pawns[typeId].pop();
      if (newState.regions[index].pawns[typeId].length === 0) delete newState.regions[index].pawns[typeId];
      updateGameWithSync(newState);
      setHoveredPawn(null);
    }
  }, [gameState, gameId, updateGameWithSync]);

  const handleRegionAdd = useCallback((index, typeId) => {
    if (!gameId) return;
    const pawnType = PAWN_TYPES.find(p => p.id === typeId);
    if (!pawnType || (pawnType.isUnique && counters.breakdown[typeId] > 0)) return;
    const newState = JSON.parse(JSON.stringify(gameState));
    const newPawn = { statuses: [...pawnType.defaultStatuses], ...(pawnType.defaultParameters ? JSON.parse(JSON.stringify(pawnType.defaultParameters)) : {}) };
    if (!newState.regions[index].pawns[typeId]) newState.regions[index].pawns[typeId] = [];
    newState.regions[index].pawns[typeId].push(newPawn);
    updateGameWithSync(newState);
  }, [gameState, gameId, counters.breakdown, updateGameWithSync]);

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
  }, [gameState, gameId, updateGameWithSync]);

  const handleUpdatePoints = useCallback((playerIndex, delta) => {
    const newState = JSON.parse(JSON.stringify(gameState));
    newState.players[playerIndex].points = Math.max(0, newState.players[playerIndex].points + delta);
    updateGameWithSync(newState);
  }, [gameState, updateGameWithSync]);

  const handleResetBoard = useCallback(async () => {
    if (gameId && window.confirm('Reset game?')) {
      try { const serverData = await resetMap(gameId); if (serverData && serverData.regions) setGameState(serverData); setIsMenuOpen(false); } catch (err) { alert('Reset failed'); }
    }
  }, [gameId]);

  const filteredSets = useMemo(() => {
    if (!gameState.sets) return [];
    if (playerId) return gameState.sets.items.filter(s => s.ownerId === playerId);
    return gameState.sets.items.filter(s => s.ownerId === null);
  }, [gameState.sets, playerId]);

  if (!gameId) return <LandingPage inputGameId={inputGameId} setInputGameId={setInputGameId} onGoToGame={(e) => { e.preventDefault(); if (inputGameId.trim()) { window.location.href = `/game/${inputGameId.trim()}`; } }} />;

  return (
    <div className="app-container">
      <div className="top-header-bar">
        <button className="menu-toggle-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}><div className="hamburger-icon"><span></span><span></span><span></span></div></button>
        <div className="game-id-info">Game ID: <strong>{gameId}</strong></div>
        <div className="header-actions">
          <button className={`sets-toggle-btn ${isSetsPanelOpen ? 'active' : ''}`} onClick={() => setIsSetsPanelOpen(!isSetsPanelOpen)}>SETS</button>
        </div>
        {isMenuOpen && (
          <>
            <div className="menu-backdrop" onClick={() => setIsMenuOpen(false)}></div>
            <div className="dropdown-menu">
              <button className="menu-item" onClick={() => { const dataStr = JSON.stringify(gameState, null, 2); const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr); const link = document.createElement('a'); link.href = dataUri; link.download = `game_${gameId}.json`; link.click(); }}>Download Board</button>
              <label className="menu-item">Upload Board<input type="file" accept=".json" onChange={(e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (ev) => { try { const data = JSON.parse(ev.target.result); if (data && data.regions) await updateGameWithSync(data); } catch (err) { alert('Failed'); } }; reader.readAsText(file); setIsMenuOpen(false); }} style={{ display: 'none' }} /></label>
              <button className="menu-item reset" onClick={handleResetBoard}>Reset Game</button>
              <button className="menu-item" onClick={() => { window.history.pushState({}, '', '/'); setGameId(null); setGameState(INITIAL_STATE); }}>Change Game</button>
            </div>
          </>
        )}
      </div>

      <div className="game-layout-wrapper">
        <div className="left-controls">
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
      {hoveredPawn && !activePawn && !activeSet && <PawnStatusPopup pawn={hoveredPawn.pawn} pawnType={hoveredPawn.pawnType} position={{ x: hoveredPawn.x, y: hoveredPawn.y }} />}
    </div>
  );
}

export default App;
