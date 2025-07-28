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

// Store online users
const userSocketMap = new Map<string, string>();

export function getReceiverSocketId(userId: string) {
  return userSocketMap.get(userId);
}

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  const userId = socket.handshake.query.userId as string;
  if (userId && !userSocketMap.has(userId)) {
    userSocketMap.set(userId, socket.id);
    io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));

    socket.broadcast.emit('userStatus', { userId, status: 'online' });
    console.log(
      `User with ID ${userId} is online.\nOnline users: ${userSocketMap.size}`,
    );
  }

  socket.on('disconnect', () => {
    console.log('A user disconnected', socket.id);

    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));

        socket.broadcast.emit('userStatus', { userId, status: 'offline' });
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
