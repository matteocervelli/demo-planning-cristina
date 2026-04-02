import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import bodyParser from 'body-parser';

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    saturation: 75,
    bigRocks: ['Chiusura Bilancio Rossi Srl', 'Analisi Processo Delega Team', 'Revisione Procedure Antiriciclaggio'],
    dailyMITs: ['Pianificazione agenda', '', ''],
    nextActions: ['Inviare F24 Bianchi', 'Chiamare Filiale Milano', 'Prenotare corso aggiornamento'],
    specialties: {},
    blocks: [],
    emergencyLogs: []
  }, null, 2));
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // API Routes
  app.get('/api/data', (req, res) => {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: 'Failed to read data' });
    }
  });

  app.post('/api/data', (req, res) => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save data' });
    }
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
