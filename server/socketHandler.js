import { getGameData, saveFullState } from './gameLogic.js';
import { ActionService } from '../shared/actions/actionService.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => { 
    const gameId = socket.handshake.query.gameId;
    if (gameId) {
      socket.join(`game:${gameId}`);
      console.log(`Socket ${socket.id} joined game:${gameId}`);
    }
    
    socket.on('joinGame', (id) => {
      socket.join(`game:${id}`);
      console.log(`Socket ${socket.id} joined game:${id} via joinGame event`);
      try {
        const { data } = getGameData(id);
        socket.emit('boardUpdate', data);
      } catch (_err) {
        // Game state may not be created yet
      }
    });

    // Semantic Action Listeners
    socket.on('action:placeSet', ({ gameId, playerId, setId, toIndex }, callback) => {
      try {
        const { data } = getGameData(gameId);
        ActionService.handlePlaceSet(data, { playerId, setId, toIndex });
        saveFullState(gameId, data);
        io.to(`game:${gameId}`).emit('boardUpdate', data);
        if (callback) callback({ status: 'ok', state: data });
      } catch (err) {
        console.error('action:placeSet error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:movePawn', ({ gameId, playerId, typeId, fromIndex, toIndex, pawnInstanceIndex }, callback) => {
      try {
        const { data } = getGameData(gameId);
        ActionService.handleMovePawn(data, { playerId, typeId, fromIndex, toIndex, pawnInstanceIndex });
        saveFullState(gameId, data);
        io.to(`game:${gameId}`).emit('boardUpdate', data);
        if (callback) callback({ status: 'ok', state: data });
      } catch (err) {
        console.error('action:movePawn error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:selectGeneral', ({ gameId, playerId, race }, callback) => {
      try {
        const { data } = getGameData(gameId);
        ActionService.handleSelectGeneral(data, { playerId, race });
        saveFullState(gameId, data);
        io.to(`game:${gameId}`).emit('boardUpdate', data);
        if (callback) callback({ status: 'ok', state: data });
      } catch (err) {
        console.error('action:selectGeneral error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:kablowanieSet', ({ gameId, playerId, setId }, callback) => {
      try {
        const { data } = getGameData(gameId);
        ActionService.handleKablowanieSet(data, { playerId, setId });
        saveFullState(gameId, data);
        io.to(`game:${gameId}`).emit('boardUpdate', data);
        if (callback) callback({ status: 'ok', state: data });
      } catch (err) {
        console.error('action:kablowanieSet error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    socket.on('action:passTurn', ({ gameId, playerId }, callback) => {
      try {
        const { data } = getGameData(gameId);
        ActionService.handlePassTurn(data, { playerId });
        saveFullState(gameId, data);
        io.to(`game:${gameId}`).emit('boardUpdate', data);
        if (callback) callback({ status: 'ok', state: data });
      } catch (err) {
        console.error('action:passTurn error:', err);
        if (callback) callback({ status: 'error', message: err.message });
      }
    });

    // Fallback sync full state
    socket.on('action:syncState', ({ gameId, state }, callback) => {
      try {
        saveFullState(gameId, state);
        io.to(`game:${gameId}`).emit('boardUpdate', state);
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
