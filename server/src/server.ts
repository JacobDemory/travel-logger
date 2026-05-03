import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import tripsRouter from './routes/trips.js';
import { prisma } from './lib/prisma.js';

const app = express();
const port = Number(process.env.PORT) || 5001;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: clientUrl }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/trips', tripsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.listen(port, () => {
  console.log(`Travel Logger API running on http://localhost:${port}`);
});
