import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  },
});

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Handle user joining
  socket.on('user_online', (userId: string) => {
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit('user_status', { userId, status: 'online' });
    console.log(`User ${userId} is online`);
  });

  // Handle joining chat rooms (for private messages)
  socket.on('join_chat', (chatId: string) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Handle sending messages
  socket.on(
    'send_message',
    (messageData: { chatId: string; message: any; receiverId: string }) => {
      // Emit to all users in the chat room
      socket
        .to(messageData.chatId)
        .emit('receive_message', messageData.message);

      // Optionally, emit to specific receiver if they're online
      const receiverSocketId = onlineUsers.get(messageData.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message_notification', {
          chatId: messageData.chatId,
          message: messageData.message,
        });
      }
    },
  );

  // Handle typing indicators
  socket.on('typing_start', (data: { chatId: string; userId: string }) => {
    socket.to(data.chatId).emit('user_typing', data);
  });

  socket.on('typing_stop', (data: { chatId: string; userId: string }) => {
    socket.to(data.chatId).emit('user_stop_typing', data);
  });

  // Handle user leaving
  socket.on('disconnect', () => {
    console.log('A user disconnected', socket.id);

    // Remove user from online list
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        socket.broadcast.emit('user_status', { userId, status: 'offline' });
        break;
      }
    }
  });
});

io.on('error', (err) => {
  console.error('Socket.IO server error:', err);
});

export { io, app, server };
