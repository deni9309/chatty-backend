import express from 'express';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.route';
import messagesRoutes from './routes/messages.route';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);

app.use(errorHandler);

export default app;