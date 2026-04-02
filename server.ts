import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import bodyParser from 'body-parser';
import { EMPTY_DATA } from './src/planner/defaults.js';
import { normalizeData } from './src/planner/utils.js';

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data.json');
const PID_FILE = path.join(process.cwd(), 'planner.pid');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DATA, null, 2));
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  let httpServer: ReturnType<typeof app.listen> | undefined;

  // API Routes
  app.get('/api/data', (req, res) => {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      res.json(normalizeData(JSON.parse(data)));
    } catch (error) {
      res.status(500).json({ error: 'Failed to read data' });
    }
  });

  app.post('/api/data', (req, res) => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(normalizeData(req.body), null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save data' });
    }
  });

  app.get('/api/status', (req, res) => {
    res.json({ ok: true, pid: process.pid, port: PORT });
  });

  app.post('/api/shutdown', (req, res) => {
    res.json({ stopping: true });
    setTimeout(() => {
      void gracefulShutdown();
    }, 200);
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0'
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  async function gracefulShutdown() {
    try {
      if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    } catch (error) {
      console.error('Failed to remove pid file', error);
    }
    httpServer?.close(() => process.exit(0));
  }

  process.on('SIGINT', () => void gracefulShutdown());
  process.on('SIGTERM', () => void gracefulShutdown());

  httpServer = app.listen(PORT, '0.0.0.0', () => {
    fs.writeFileSync(PID_FILE, `${process.pid}\n`);
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
