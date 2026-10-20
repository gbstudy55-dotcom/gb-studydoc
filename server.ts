import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

app.use(express.json({ limit: '15mb' }));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helpers to read/write persistent data
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }
  return null;
}

function writeData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/data', (req, res) => {
  const data = readData() || {};
  if (data.platforms && Array.isArray(data.platforms)) {
    data.platforms.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }
  res.json(data);
});

app.post('/api/platforms', (req, res) => {
  const { platforms } = req.body;
  if (!Array.isArray(platforms)) {
    return res.status(400).json({ error: 'platforms must be an array' });
  }
  const current = readData() || {};
  current.platforms = platforms;
  current.updatedAt = new Date().toISOString();
  writeData(current);
  res.json({ success: true, count: platforms.length });
});

app.post('/api/settings', (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings object' });
  }
  const current = readData() || {};
  current.settings = settings;
  current.updatedAt = new Date().toISOString();
  writeData(current);
  res.json({ success: true });
});

app.post('/api/reset', (req, res) => {
  if (fs.existsSync(DATA_FILE)) {
    try {
      fs.unlinkSync(DATA_FILE);
    } catch (e) {
      console.error(e);
    }
  }
  res.json({ success: true, message: 'Reset completed' });
});

// Setup Vite or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
