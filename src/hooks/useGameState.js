import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { fetchMap, updateMap } from '../services/api';
import { INITIAL_STATE } from '../constants/game';
import { SERVER_URL, HISTORY_LIMIT } from '../constants/constants';

const socket = io(SERVER_URL);

const getTime = () => new Date().toLocaleTimeString();

export const useGameState = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  const isAdminPath = currentPath.startsWith('/admin');

  useEffect(() => {
    const handlePath = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      const match = path.match(/^\/game\/([^/]+)/);
      const newGameId = match ? match[1] : null;
      setGameId(newGameId);
      setIsLoaded(false); // Reset loaded flag on path/game change
      const params = new URLSearchParams(window.location.search);
      setPlayerId(params.get('player') ? parseInt(params.get('player')) : null);
    };
    handlePath();
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  useEffect(() => {
    if (!gameId || isAdminPath) return;
    socket.emit('joinGame', gameId);

    // Fetch game title
    fetch(`${SERVER_URL}/api/config/title`)
      .then(res => res.json())
      .then(data => setGameState(prev => ({ ...prev, gameTitle: data.title })))
      .catch(console.error);

    fetchMap(gameId).then(d => { 
      if (d && d.regions) {
        setGameState(prev => ({ ...prev, ...d })); 
        setIsLoaded(true);
      }
    }).catch(console.error);

    const handleUpdate = (newData) => { 
      if (newData && newData.regions) {
        setGameState(prev => ({ ...prev, ...newData })); 
        setIsLoaded(true);
      }
    };
    socket.on('boardUpdate', handleUpdate);
    return () => socket.off('boardUpdate', handleUpdate);
  }, [gameId, isAdminPath]);

  const updateGameWithSync = useCallback(async (newState) => {
    if (!gameId) return;
    setGameState(newState);
    try { await updateMap(gameId, newState); } catch (err) { console.error('Sync failed:', err); }
  }, [gameId]);

  const addLog = useCallback((state, text, metadata = {}) => {
    let newHistory = [...(state.history || []), { 
      time: getTime(), 
      text,
      ...metadata
    }];
    if (newHistory.length > HISTORY_LIMIT) {
      newHistory = newHistory.slice(newHistory.length - HISTORY_LIMIT);
    }
    state.history = newHistory;
  }, []);

  return {
    gameId,
    setGameId,
    playerId,
    setPlayerId,
    gameState,
    setGameState,
    isLoaded,
    currentPath,
    setCurrentPath,
    isAdminPath,
    updateGameWithSync,
    addLog
  };
};
