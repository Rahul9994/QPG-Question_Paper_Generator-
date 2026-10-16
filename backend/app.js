import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateRouter from './routes/generate.js';
import { getStatus } from './lib/groq.js';

dotenv.config();

// The Express app, shared by the local server (server.js) and the Vercel
// function (api/index.js). Stateless: paper archives live in each browser.
const app = express();

app.set('trust proxy', true);

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);

app.use(express.json({ limit: '100kb' }));

app.use('/api/generate', generateRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Which Groq model the auto-selector would use right now
app.get('/api/model', async (_req, res) => {
  try {
    res.json(await getStatus());
  } catch (err) {
    res.status(err.status || 500).json({ provider: 'groq', configured: true, model: null, error: err.message });
  }
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

export default app;
