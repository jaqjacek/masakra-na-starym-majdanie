import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { fetchMap } from '../services/api';
import { INITIAL_STATE } from '../constants/game';
import { SERVER_URL, HISTORY_LIMIT, DEFAULT_AUTOPLAY_SPEED } from '../constants/constants';
import { isIncomingStateStale } from '../../shared/stateRecency.js';

const socket = io(SERVER_URL || undefined);
let reportedAutoplaySpeed = DEFAULT_AUTOPLAY_SPEED;
let spectatorClientLock = false;

export function setSpectatorClientLock(locked) {
  spectatorClientLock = !!locked;
}

export function isSpectatorClientLocked() {
  return spectatorClientLock;
}

export function reportAutoplaySpeed(speed) {
  const n = Number(speed);
  if (Number.isFinite(n) && n > 0) reportedAutoplaySpeed = n;
}

export function currentAutoplaySpeed() {
  return reportedAutoplaySpeed;
}

const getTime = () => new Date().toLocaleTimeString();

export const useGameState = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [gameId, setGameId] = useState(() => {
    const match = window.location.pathname.match(/^\/game\/([^/]+)/);
    return match ? match[1] : null;
  });
  const [playerId, setPlayerId] = useState(() => {
    const raw = new URLSearchParams(window.location.search).get('player');
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? raw : n;
  });
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
    socket.emit('joinGame', { gameId, playerId, autoplaySpeed: reportedAutoplaySpeed });

    // Fetch game title
    fetch(`${SERVER_URL}/api/config/title`)
      .then(res => res.json())
      .then(data => setGameState(prev => ({ ...prev, gameTitle: data.title })))
      .catch(console.error);

    fetchMap(gameId).then(d => { 
      if (d && d.regions) {
        setGameState(prev => {
          if (spectatorClientLock || isIncomingStateStale(d, prev)) return prev;
          return { ...prev, ...d, spectatorAction: d.spectatorAction ?? null };
        }); 
        setIsLoaded(true);
      }
    }).catch(console.error);

    const handleUpdate = (newData) => { 
      if (spectatorClientLock) return;
      if (newData && newData.regions) {
        setGameState(prev => {
          if (isIncomingStateStale(newData, prev)) return prev;
          return { ...prev, ...newData, spectatorAction: newData.spectatorAction ?? null };
        }); 
        setIsLoaded(true);
      }
    };
    socket.on('boardUpdate', handleUpdate);
    return () => socket.off('boardUpdate', handleUpdate);
  }, [gameId, isAdminPath, playerId]);

  const dispatchAction = useCallback((actionName, payload = {}) => {
    if (!gameId || spectatorClientLock) return;
    socket.emit(`action:${actionName}`, { gameId, playerId, autoplaySpeed: reportedAutoplaySpeed, ...payload });
  }, [gameId, playerId]);

  const updateGameWithSync = useCallback((newState) => {
    if (!gameId || spectatorClientLock) return;
    setGameState(newState);
    socket.emit('action:syncState', { gameId, state: newState, autoplaySpeed: reportedAutoplaySpeed });
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
    dispatchAction,
    updateGameWithSync,
    addLog,
    socket
  };
};
