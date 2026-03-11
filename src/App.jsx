import React, { useState, useCallback, useEffect, useMemo } from 'react';
import './App.css';
import Board from './components/Board';
import Bag from './components/Bag';
import PawnGhost from './components/PawnGhost';
import LandingPage from './components/LandingPage';
import GameHeader from './components/GameHeader';
import PawnStatusPopup from './components/PawnStatusPopup';
import { fetchMap, updateMap, resetMap } from './services/api';
import { io } from 'socket.io-client';
import { PAWN_TYPES, STATUSES } from './constants/pawnTypes';

// Initial board helper
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

const INITIAL_BOARD = createEmptyBoard();

const getReachableRegions = (board, startIndex, range) => {
  const reachable = new Set();
  const queue = [{ index: startIndex, dist: 0 }];
  const visited = new Set([startIndex]);
  while (queue.length > 0) {
    const { index, dist } = queue.shift();
    if (dist > 0) reachable.add(index);
    if (dist < range) {
      board[index].neighbors.forEach(neighborIndex => {
        if (!visited.has(neighborIndex)) {
          visited.add(neighborIndex);
          queue.push({ index: neighborIndex, dist: dist + 1 });
        }
      });
    }
  }
  return Array.from(reachable);
};

const socket = io('http://localhost:3001');

function App() {
  const [gameId, setGameId] = useState(null);
  const [inputGameId, setInputGameId] = useState('');
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [activePawn, setActivePawn] = useState(null); 
  const [hoveredPawn, setHoveredPawn] = useState(null);
  const [validMoveTargets, setValidMoveTargets] = useState([]);

  useEffect(() => {
    const handlePath = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/game\/([^/]+)/);
      setGameId(match ? match[1] : null);
    };
    handlePath();
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  useEffect(() => {
    if (!gameId) return;
    socket.emit('joinGame', gameId);
    fetchMap(gameId)
      .then(serverBoard => { if (serverBoard) setBoard(serverBoard); })
      .catch(err => console.error('Failed to load board:', err));
    const handleUpdate = (newBoard) => setBoard(newBoard);
    socket.on('boardUpdate', handleUpdate);
    return () => socket.off('boardUpdate', handleUpdate);
  }, [gameId]);

  const updateBoardWithSync = useCallback(async (newBoard) => {
    if (!gameId) return;
    setBoard(newBoard);
    try {
      await updateMap(gameId, newBoard);
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }, [gameId]);

  const counters = useMemo(() => {
    const breakdown = PAWN_TYPES.reduce((acc, pawn) => { acc[pawn.id] = 0; return acc; }, {});
    let total = 0;
    board.forEach(region => {
      Object.entries(region.pawns).forEach(([typeId, instances]) => {
        if (breakdown[typeId] !== undefined && Array.isArray(instances)) {
          breakdown[typeId] += instances.length;
          total += instances.length;
        }
      });
    });
    return { total, breakdown };
  }, [board]);

  const handleBagMouseDown = useCallback((typeId, e) => {
    setActivePawn({ typeId, x: e.clientX, y: e.clientY, fromIndex: null });
    setValidMoveTargets(board.map(r => r.id));
  }, [board]);

  const handlePawnMouseDown = useCallback((typeId, regionIndex, pawnInstanceIndex, e) => {
    const instances = board[regionIndex].pawns[typeId];
    const pawn = instances[pawnInstanceIndex];
    const pawnType = PAWN_TYPES.find(p => p.id === typeId);
    if (pawn.statuses.includes(STATUSES.ENABLED)) {
      setActivePawn({ typeId, x: e.clientX, y: e.clientY, fromIndex: regionIndex, pawnInstanceIndex });
      setHoveredPawn(null);
      const reachable = getReachableRegions(board, regionIndex, pawnType.speed);
      setValidMoveTargets(reachable);
    }
  }, [board]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (activePawn) setActivePawn(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
    };
    const handleGlobalMouseUp = () => { 
      if (activePawn) {
        setActivePawn(null);
        setValidMoveTargets([]);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [activePawn]);

  const handleRegionMouseUp = useCallback((toIndex, e) => {
    if (activePawn && gameId) {
      e.stopPropagation();
      const { typeId, fromIndex, pawnInstanceIndex } = activePawn;
      if (!validMoveTargets.includes(toIndex)) {
        setActivePawn(null);
        setValidMoveTargets([]);
        return;
      }
      const newBoard = JSON.parse(JSON.stringify(board));
      if (fromIndex !== null) {
        const [movedPawn] = newBoard[fromIndex].pawns[typeId].splice(pawnInstanceIndex, 1);
        if (newBoard[fromIndex].pawns[typeId].length === 0) delete newBoard[fromIndex].pawns[typeId];
        if (!newBoard[toIndex].pawns[typeId]) newBoard[toIndex].pawns[typeId] = [];
        newBoard[toIndex].pawns[typeId].push(movedPawn);
      } else {
        const pawnType = PAWN_TYPES.find(p => p.id === typeId);
        const newPawn = { statuses: [...pawnType.defaultStatuses] };
        if (!newBoard[toIndex].pawns[typeId]) newBoard[toIndex].pawns[typeId] = [];
        newBoard[toIndex].pawns[typeId].push(newPawn);
      }
      updateBoardWithSync(newBoard);
      setActivePawn(null);
      setValidMoveTargets([]);
    }
  }, [activePawn, board, gameId, validMoveTargets, updateBoardWithSync]);

  const handleRegionRemove = useCallback((index, typeId) => {
    if (!gameId) return;
    const newBoard = JSON.parse(JSON.stringify(board));
    if (newBoard[index].pawns[typeId] && newBoard[index].pawns[typeId].length > 0) {
      newBoard[index].pawns[typeId].pop();
      if (newBoard[index].pawns[typeId].length === 0) delete newBoard[index].pawns[typeId];
      updateBoardWithSync(newBoard);
      setHoveredPawn(null);
    }
  }, [board, gameId, updateBoardWithSync]);

  const handleRegionAdd = useCallback((index, typeId) => {
    if (!gameId) return;
    const pawnType = PAWN_TYPES.find(p => p.id === typeId);
    if (!pawnType) return;
    const newBoard = JSON.parse(JSON.stringify(board));
    const newPawn = { statuses: [...pawnType.defaultStatuses] };
    if (!newBoard[index].pawns[typeId]) newBoard[index].pawns[typeId] = [];
    newBoard[index].pawns[typeId].push(newPawn);
    updateBoardWithSync(newBoard);
  }, [board, gameId, updateBoardWithSync]);

  const handleResetBoard = useCallback(async () => {
    if (gameId && window.confirm('Reset board?')) {
      try { await resetMap(gameId); } catch (err) { alert('Reset failed'); }
    }
  }, [gameId]);

  const goToGame = (e) => {
    e.preventDefault();
    if (inputGameId.trim()) {
      window.history.pushState({}, '', `/game/${inputGameId.trim()}`);
      setGameId(inputGameId.trim());
      setInputGameId('');
    }
  };

  if (!gameId) {
    return <LandingPage inputGameId={inputGameId} setInputGameId={setInputGameId} onGoToGame={goToGame} />;
  }

  return (
    <div className="app-container">
      <GameHeader gameId={gameId} counters={counters} />
      <div className="game-layout">
        <div className="bags-container">
          {PAWN_TYPES.map(pawn => (
            <Bag key={pawn.id} type={pawn} onMouseDown={(e) => handleBagMouseDown(pawn.id, e)} />
          ))}
        </div>
        <Board 
          regions={board} 
          onRegionMouseUp={handleRegionMouseUp} 
          onRemovePawn={handleRegionRemove}
          onAddPawn={handleRegionAdd}
          onPawnMouseDown={handlePawnMouseDown}
          setHoveredPawn={setHoveredPawn}
          validMoveTargets={validMoveTargets}
        />
      </div>
      <div className="button-bar">
        <button className="action-button download-btn" onClick={() => {
           const dataStr = JSON.stringify(board, null, 2);
           const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
           const link = document.createElement('a');
           link.href = dataUri;
           link.download = `wedrowycz_game_${gameId}.json`;
           link.click();
        }}>Download Board</button>
        <label className="action-button upload-btn">
          Upload Board
          <input type="file" accept=".json" onChange={(e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async (ev) => {
              try {
                const uploadedBoard = JSON.parse(ev.target.result);
                if (Array.isArray(uploadedBoard)) await updateBoardWithSync(uploadedBoard);
              } catch (err) { alert('Upload failed'); }
            };
            reader.readAsText(file);
          }} style={{ display: 'none' }} />
        </label>
        <button className="action-button reset-btn" onClick={handleResetBoard}>Reset Board</button>
        <button className="action-button" onClick={() => {
          window.history.pushState({}, '', '/');
          setGameId(null);
          setBoard(INITIAL_BOARD);
        }} style={{ backgroundColor: '#555' }}>Change Game</button>
      </div>
      {activePawn && (
        <PawnGhost type={PAWN_TYPES.find(p => p.id === activePawn.typeId)} x={activePawn.x} y={activePawn.y} />
      )}
      {hoveredPawn && !activePawn && (
        <PawnStatusPopup pawn={hoveredPawn.pawn} pawnType={hoveredPawn.pawnType} position={{ x: hoveredPawn.x, y: hoveredPawn.y }} />
      )}
    </div>
  );
}

export default App;
