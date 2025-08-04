import 'reflect-metadata';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

import { connectDB } from './lib/db';
import { server, app } from './lib/socket-io';
import authRoutes from './routes/auth.route';
import messagesRoutes from './routes/messages.route';
import { errorHandler } from './middleware/error.middleware';

const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'x-csrf-token',
      'x-refresh-token',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  }),
);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(path.resolve(), '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(path.resolve(), '../frontend', 'dist', 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
  connectDB();
});
