import { io, app, server } from './socket-instance';
import { container } from 'tsyringe';
import { GamesService } from '../services/games.service';

const userSocketMap = new Map<string, string>();
const gameService = container.resolve(GamesService);

export function getUserSocketId(userId: string) {
  return userSocketMap.get(userId);
}

export function getUserSocketMap(): Map<string, string> {
  return userSocketMap;
}

export function getOnlineUserIds(): string[] {
  return Array.from(userSocketMap.keys());
}

// Cleanup orphaned connections every minute
setInterval(() => {
  let cleanedUp = 0;
  for (const [userId, socketId] of userSocketMap.entries()) {
    if (!io.sockets.sockets.has(socketId)) {
      userSocketMap.delete(userId);
      cleanedUp++;
    }
  }
  if (cleanedUp > 0) {
    console.log(`Cleaned up ${cleanedUp} orphaned connections`);
    // Broadcast updated online users after cleanup
    const onlineUserIds = Array.from(userSocketMap.keys());
    io.emit('get_online_users', onlineUserIds);
  }
}, 60000);

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  const userId = socket.handshake.query.userId as string;

  if (userId) {
    const existingSocketId = userSocketMap.get(userId);

    if (existingSocketId && io.sockets.sockets.has(existingSocketId)) {
      io.sockets.sockets.get(existingSocketId)?.disconnect();
      console.log(`Disconnected previous connection for user ${userId}`);
    }

    userSocketMap.set(userId, socket.id);
    const onlineUserIds = Array.from(userSocketMap.keys());

    socket.emit('get_online_users', onlineUserIds);

    io.emit('get_online_users', onlineUserIds);
    io.emit('user_status', { userId, status: 'online' });

    console.log(
      `User with ID ${userId} is online.\nOnline users: ${userSocketMap.size}`,
    );

    // -- Game-related event handlers --
    socket.on('game:invite', ({ recipientId }: { recipientId: string }) => {
      const invitation = gameService.createInvitation(userId, recipientId);

      if (!invitation) {
        socket.emit('game:error', { message: 'User is offline' });
      }
    });

    socket.on(
      'game:accept_invitation',
      ({ invitationId }: { invitationId: string }) => {
        const game = gameService.acceptInvitation(invitationId, userId);
        if (!game) {
          socket.emit('game:error', {
            message: 'Invalid or expired invitation',
          });
        }
      },
    );

    // Decline game invitation
    socket.on(
      'game:decline_invitation',
      ({ invitationId }: { invitationId: string }) => {
        gameService.declineInvitation(invitationId, userId);
      },
    );

    // Make a move
    socket.on(
      'game:move',
      ({ gameId, position }: { gameId: string; position: number }) => {
        const updatedGame = gameService.makeMove(gameId, userId, position);

        if (!updatedGame) {
          socket.emit('game:error', { message: 'Invalid move' });
        }
      },
    );

    // Resign from game
    socket.on('game:resign', ({ gameId }: { gameId: string }) => {
      gameService.resignGame(gameId, userId);
    });

    //Rejoin an existing game (for reconnection)
    socket.on('game:rejoin', ({ gameId }: { gameId: string }) => {
      const game = gameService.rejoinGame(gameId, userId);

      if (game) {
        socket.emit('game:rejoined', { game });
      } else {
        socket.emit('game:error', { message: 'Game not found' });
      }
    });

    // -- Typing events --
    socket.on('typing', ({ receiverId }: { receiverId: string }) => {
      const receiverSocketId = getUserSocketId(receiverId);
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit('user_typing', {
          userId,
          isTyping: true,
        });
      }
    });

    socket.on('stop_typing', ({ receiverId }: { receiverId: string }) => {
      const receiverSocketId = getUserSocketId(receiverId);
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit('user_typing', {
          userId,
          isTyping: false,
        });
      }
    });
  }

  socket.on('request_online_users', () => {
    const onlineUserIds = Array.from(userSocketMap.keys());
    socket.emit('get_online_users', onlineUserIds);
  });

  socket.on('disconnect', (reason) => {
    console.log('A user disconnected', socket.id, 'Reason:', reason);

    // Check if user was in a game
    if (userId) {
      gameService.handleUserDisconnect(userId);
    }

    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        const onlineUserIds = Array.from(userSocketMap.keys());

        io.emit('get_online_users', onlineUserIds);
        io.emit('user_status', { userId, status: 'offline' });

        console.log(
          `User with ID ${userId} went offline.\nOnline users: ${userSocketMap.size}`,
        );
        break;
      }
    }
  });
});

io.on('error', (err) => {
  console.error('Socket.IO server error:', err);
});

export { io, app, server };
