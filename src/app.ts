import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './routes/auth.route';
import messagesRoutes from './routes/messages.route';
import { errorHandler } from './middleware/error.middleware';

const app = express();

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

export default app;
