import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'x-csrf-token',
      'x-refresh-token',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  },
});

const userSocketMap = new Map<string, string>();

export function getReceiverSocketId(userId: string) {
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

    socket.on('typing', ({ receiverId }: { receiverId: string }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit('user_typing', {
          userId,
          isTyping: true,
        });
      }
    });

    socket.on('stop_typing', ({ receiverId }: { receiverId: string }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
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
