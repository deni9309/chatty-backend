import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './lib/db';

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
  connectDB();
});
