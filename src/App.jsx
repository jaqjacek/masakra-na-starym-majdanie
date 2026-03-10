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

const INITIAL_BOARD = Array(25).fill(null).map(() => ({}));

// WebSocket instance
const socket = io('http://localhost:3001');

function App() {
  const [gameId, setGameId] = useState(null);
  const [inputGameId, setInputGameId] = useState('');
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [activePawn, setActivePawn] = useState(null); // { typeId, x, y, fromIndex, pawnInstanceIndex }
  const [hoveredPawn, setHoveredPawn] = useState(null); // { pawn, pawnType, x, y }

  // Parse gameId from URL
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

  // Sync board with server
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
    const breakdown = PAWN_TYPES.reduce((acc, pawn) => {
      acc[pawn.id] = 0;
      return acc;
    }, {});
    let total = 0;
    board.forEach(region => {
      Object.entries(region).forEach(([typeId, instances]) => {
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
  }, []);

  const handlePawnMouseDown = useCallback((typeId, regionIndex, pawnInstanceIndex, e) => {
    const instances = board[regionIndex][typeId];
    const pawn = instances[pawnInstanceIndex];
    if (pawn.statuses.includes(STATUSES.ENABLED)) {
      setActivePawn({ 
        typeId, 
        x: e.clientX, 
        y: e.clientY, 
        fromIndex: regionIndex,
        pawnInstanceIndex 
      });
      setHoveredPawn(null); // Hide popup when dragging starts
    }
  }, [board]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (activePawn) setActivePawn(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
    };
    const handleGlobalMouseUp = () => { if (activePawn) setActivePawn(null); };
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
      const newBoard = JSON.parse(JSON.stringify(board));

      if (fromIndex !== null) {
        const [movedPawn] = newBoard[fromIndex][typeId].splice(pawnInstanceIndex, 1);
        if (newBoard[fromIndex][typeId].length === 0) delete newBoard[fromIndex][typeId];
        if (!newBoard[toIndex][typeId]) newBoard[toIndex][typeId] = [];
        newBoard[toIndex][typeId].push(movedPawn);
      } else {
        const pawnType = PAWN_TYPES.find(p => p.id === typeId);
        const newPawn = { statuses: [...pawnType.defaultStatuses] };
        if (!newBoard[toIndex][typeId]) newBoard[toIndex][typeId] = [];
        newBoard[toIndex][typeId].push(newPawn);
      }

      updateBoardWithSync(newBoard);
      setActivePawn(null);
    }
  }, [activePawn, board, gameId, updateBoardWithSync]);

  const handleRegionRemove = useCallback((index, typeId) => {
    if (!gameId) return;
    const newBoard = JSON.parse(JSON.stringify(board));
    if (newBoard[index][typeId] && newBoard[index][typeId].length > 0) {
      newBoard[index][typeId].pop();
      if (newBoard[index][typeId].length === 0) delete newBoard[index][typeId];
      updateBoardWithSync(newBoard);
      setHoveredPawn(null);
    }
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
          onPawnMouseDown={handlePawnMouseDown}
          setHoveredPawn={setHoveredPawn}
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
        <PawnStatusPopup 
          pawn={hoveredPawn.pawn} 
          pawnType={hoveredPawn.pawnType} 
          position={{ x: hoveredPawn.x, y: hoveredPawn.y }} 
        />
      )}
    </div>
  );
}

export default App;
