import { getGameData, saveFullState } from './gameLogic.js';
import { ActionService } from '../shared/actions/actionService.js';
import { claimManualPlayer, describeHumanAction, describeSyncedAction, enqueueGame, noteAutoplaySpeed, pointsSnapshot, revealAfterChange } from './services/playerAiService.js';
import { isSpectatorLocked } from './services/spectatorReplayService.js';
import { loadOrCreateGame, isGameInitialized } from './services/gameService.js';
import { isIncomingStateStale } from '../shared/stateRecency.js';

function persistThenAi(gameId, io, callback, mutate) {
  return enqueueGame(gameId, async () => {
    try {
      const { data } = getGameData(gameId);
      if (isSpectatorLocked(data)) {
        if (callback) callback({ status: 'error', message: 'spectator replay is read-only' });
        return data;
      }
      const opening = mutate ? mutate(data) : null;
      saveFullState(gameId, data);
      const result = await revealAfterChange(gameId, io, data, opening);
      if (callback) callback({ status: 'ok', state: result });
      return result;
    } catch (err) {
      console.error('persistThenAi error:', err);
      if (callback) callback({ status: 'error', message: err.message });
      return null;
    }
  });
}

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => { 
    const gameId = socket.handshake.query.gameId;
    if (gameId) {
      socket.join(`game:${gameId}`);
      console.log(`Socket ${socket.id} joined game:${gameId}`);
    }

    socket.use((packet, next) => {
      const payload = packet[1];
      if (payload && typeof payload === 'object' && payload.gameId !== undefined && payload.autoplaySpeed !== undefined) {
        noteAutoplaySpeed(payload.gameId, payload.autoplaySpeed);
      }
      next();
    });
    
    socket.on('joinGame', (payload) => {
      const id = (payload && typeof payload === 'object') ? (payload.gameId ?? payload.id) : payload;
      const joinPlayerId = (payload && typeof payload === 'object') ? payload.playerId : undefined;
      if (id === null || id === undefined || id === '') return;
      if (payload && typeof payload === 'object' && payload.autoplaySpeed !== undefined) {
        noteAutoplaySpeed(id, payload.autoplaySpeed);
      }
      socket.join(`game:${id}`);
      console.log(`Socket ${socket.id} joined game:${id} via joinGame event`);
      enqueueGame(id, async () => {
        try {
          const data = loadOrCreateGame(id, io);
          if (isSpectatorLocked(data)) return;
          if (joinPlayerId !== null && joinPlayerId !== undefined) {
            claimManualPlayer(data, joinPlayerId);
          }
          await revealAfterChange(id, io, data);
        } catch (_err) {
          // Game state may not be created yet
        }
      });
    });

    socket.on('action:claimPlayer', ({ gameId, playerId }, callback) => {
      try {
        persistThenAi(gameId, io, callback, (data) => {
          claimManualPlayer(data, playerId);
          return null;
        });
      } catch (err) {
        console.error('action:claimPlayer error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:placeSet', ({ gameId, playerId, setId, toIndex }, callback) => {
      try {
        persistThenAi(gameId, io, callback, (data) => {
          const beforePoints = pointsSnapshot(data);
          ActionService.handlePlaceSet(data, { playerId, setId, toIndex });
          return describeHumanAction(data, 'place', { playerId, setId, toIndex, beforePoints });
        });
      } catch (err) {
        console.error('action:placeSet error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:movePawn', ({ gameId, playerId, typeId, fromIndex, toIndex, pawnInstanceIndex }, callback) => {
      try {
        persistThenAi(gameId, io, callback, (data) => {
          ActionService.handleMovePawn(data, { playerId, typeId, fromIndex, toIndex, pawnInstanceIndex });
          return null;
        });
      } catch (err) {
        console.error('action:movePawn error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:selectGeneral', ({ gameId, playerId, race }, callback) => {
      try {
        persistThenAi(gameId, io, callback, (data) => {
          ActionService.handleSelectGeneral(data, { playerId, race });
          return null;
        });
      } catch (err) {
        console.error('action:selectGeneral error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:kablowanieSet', ({ gameId, playerId, setId }, callback) => {
      try {
        persistThenAi(gameId, io, callback, (data) => {
          ActionService.handleKablowanieSet(data, { playerId, setId });
          return describeHumanAction(data, 'kablowanie', { playerId, setId });
        });
      } catch (err) {
        console.error('action:kablowanieSet error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:passTurn', ({ gameId, playerId }, callback) => {
      try {
        persistThenAi(gameId, io, callback, (data) => {
          ActionService.handlePassTurn(data, { playerId });
          return describeHumanAction(data, 'pass', { playerId });
        });
      } catch (err) {
        console.error('action:passTurn error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:drawSets', ({ gameId }, callback) => {
      try {
        persistThenAi(gameId, io, callback, (data) => {
          ActionService.handleDrawSets(data);
          return null;
        });
      } catch (err) {
        console.error('action:drawSets error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:syncState', ({ gameId, state }, callback) => {
      enqueueGame(gameId, async () => {
        try {
          if (!isGameInitialized(gameId)) {
            if (callback) callback({ status: 'error', message: 'game not initialized' });
            return;
          }
          const { data: previous } = getGameData(gameId);
          if (isSpectatorLocked(previous)) {
            if (callback) callback({ status: 'error', message: 'spectator replay is read-only' });
            return;
          }
          if (isIncomingStateStale(state, previous)) {
            await revealAfterChange(gameId, io, previous);
            if (callback) callback({ status: 'stale', state: previous });
            return;
          }
          delete state.spectatorAction;
          const opening = describeSyncedAction(previous, state);
          saveFullState(gameId, state);
          await revealAfterChange(gameId, io, state, opening);
          if (callback) callback({ status: 'ok' });
        } catch (err) {
          console.error('action:syncState error:', err);
          if (callback) callback({ status: 'error', message: err.message });
        }
      });
    });

    socket.on('setAutoplaySpeed', ({ gameId: speedGameId, autoplaySpeed }) => {
      noteAutoplaySpeed(speedGameId, autoplaySpeed);
    });

    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
}
