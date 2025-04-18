import express from 'express';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.route';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
