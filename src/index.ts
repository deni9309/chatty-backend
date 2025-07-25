import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './lib/db';
import { server } from './lib/socket-io';

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
  connectDB();
});
