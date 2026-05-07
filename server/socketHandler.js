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
    });

    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
}
