import express from 'express';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.route';
import { connectDB } from './lib/db';

dotenv.config();
const port = process.env.PORT;

const app = express();

app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
  connectDB();
});
