import { getGameData, saveFullState } from './gameLogic.js';
import { ActionService } from '../shared/actions/actionService.js';
import { afterGameChange, claimManualPlayer } from './services/playerAiService.js';
import { loadOrCreateGame, isGameInitialized } from './services/gameService.js';
import { isIncomingStateStale } from '../shared/stateRecency.js';

function persistThenAi(gameId, data, io, callback) {
  saveFullState(gameId, data);
  afterGameChange(gameId, io, data);
  if (callback) callback({ status: 'ok', state: data });
}

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => { 
    const gameId = socket.handshake.query.gameId;
    if (gameId) {
      socket.join(`game:${gameId}`);
      console.log(`Socket ${socket.id} joined game:${gameId}`);
    }
    
    socket.on('joinGame', (payload) => {
      const id = (payload && typeof payload === 'object') ? (payload.gameId ?? payload.id) : payload;
      const joinPlayerId = (payload && typeof payload === 'object') ? payload.playerId : undefined;
      if (id === null || id === undefined || id === '') return;
      socket.join(`game:${id}`);
      console.log(`Socket ${socket.id} joined game:${id} via joinGame event`);
      try {
        const data = loadOrCreateGame(id, io);
        if (joinPlayerId !== null && joinPlayerId !== undefined) {
          claimManualPlayer(data, joinPlayerId);
        }
        afterGameChange(id, io, data);
      } catch (_err) {
        // Game state may not be created yet
      }
    });

    socket.on('action:claimPlayer', ({ gameId, playerId }, callback) => {
      try {
        const { data } = getGameData(gameId);
        claimManualPlayer(data, playerId);
        persistThenAi(gameId, data, io, callback);
      } catch (err) {
        console.error('action:claimPlayer error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:placeSet', ({ gameId, playerId, setId, toIndex }, callback) => {
      try {
        const { data } = getGameData(gameId);
        ActionService.handlePlaceSet(data, { playerId, setId, toIndex });
        persistThenAi(gameId, data, io, callback);
      } catch (err) {
        console.error('action:placeSet error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:movePawn', ({ gameId, playerId, typeId, fromIndex, toIndex, pawnInstanceIndex }, callback) => {
      try {
        const { data } = getGameData(gameId);
        ActionService.handleMovePawn(data, { playerId, typeId, fromIndex, toIndex, pawnInstanceIndex });
        persistThenAi(gameId, data, io, callback);
      } catch (err) {
        console.error('action:movePawn error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:selectGeneral', ({ gameId, playerId, race }, callback) => {
      try {
        const { data } = getGameData(gameId);
        ActionService.handleSelectGeneral(data, { playerId, race });
        persistThenAi(gameId, data, io, callback);
      } catch (err) {
        console.error('action:selectGeneral error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:kablowanieSet', ({ gameId, playerId, setId }, callback) => {
      try {
        const { data } = getGameData(gameId);
        ActionService.handleKablowanieSet(data, { playerId, setId });
        persistThenAi(gameId, data, io, callback);
      } catch (err) {
        console.error('action:kablowanieSet error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:passTurn', ({ gameId, playerId }, callback) => {
      try {
        const { data } = getGameData(gameId);
        ActionService.handlePassTurn(data, { playerId });
        persistThenAi(gameId, data, io, callback);
      } catch (err) {
        console.error('action:passTurn error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:drawSets', ({ gameId }, callback) => {
      try {
        const { data } = getGameData(gameId);
        ActionService.handleDrawSets(data);
        persistThenAi(gameId, data, io, callback);
      } catch (err) {
        console.error('action:drawSets error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:syncState', ({ gameId, state }, callback) => {
      try {
        if (isGameInitialized(gameId)) {
          const { data: current } = getGameData(gameId);
          if (isIncomingStateStale(state, current)) {
            if (io) io.to(`game:${gameId}`).emit('boardUpdate', current);
            if (callback) callback({ status: 'stale', state: current });
            return;
          }
        }
        saveFullState(gameId, state);
        afterGameChange(gameId, io, state);
        if (callback) callback({ status: 'ok' });
      } catch (err) {
        console.error('action:syncState error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
}
