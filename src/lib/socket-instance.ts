import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import { getAllowedOrigins } from './utils';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
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

export { io, app, server };