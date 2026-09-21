import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Cartella dove verranno salvate fisicamente le foto caricate
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'portfolio');

// Assicuriamoci che la cartella base esista
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve the uploads folder as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configurazione di Multer per il salvataggio dei file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'Uncategorized';
    const catPath = path.join(UPLOADS_DIR, category);
    if (!fs.existsSync(catPath)) {
      fs.mkdirSync(catPath, { recursive: true });
    }
    cb(null, catPath);
  },
  filename: (req, file, cb) => {
    // Generiamo un nome file unico per evitare sovrascritture
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

// 1. GET /api/portfolio (Restituisce categorie e relative immagini)
app.get('/api/portfolio', (req, res) => {
  try {
    const categories = [];
    const imagesByCategory = {};
    
    if (fs.existsSync(UPLOADS_DIR)) {
      const items = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          const categoryName = item.name;
          categories.push(categoryName);
          
          const catPath = path.join(UPLOADS_DIR, categoryName);
          const files = fs.readdirSync(catPath);
          const imageUrls = files
            .filter(f => f.match(/\.(jpg|jpeg|png|gif|webp)$/i))
            .map(f => `/uploads/portfolio/${encodeURIComponent(categoryName)}/${encodeURIComponent(f)}`);
            
          // Usiamo un ID normalizzato per la chiave, come fa il frontend
          imagesByCategory[categoryName.toLowerCase().replace(/\s+/g, '')] = imageUrls;
        }
      }
    }
    
    res.json({ categories, imagesByCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante la lettura del portfolio' });
  }
});

// 2. POST /api/portfolio/category (Crea una nuova cartella categoria)
app.post('/api/portfolio/category', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome categoria mancante' });
  
  const catPath = path.join(UPLOADS_DIR, name);
  if (!fs.existsSync(catPath)) {
    fs.mkdirSync(catPath, { recursive: true });
    res.json({ success: true, message: 'Categoria creata' });
  } else {
    res.status(400).json({ error: 'Categoria già esistente' });
  }
});

// 3. DELETE /api/portfolio/category/:name (Elimina intera categoria)
app.delete('/api/portfolio/category/:name', (req, res) => {
  const { name } = req.params;
  const catPath = path.join(UPLOADS_DIR, name);
  
  if (fs.existsSync(catPath)) {
    fs.rmSync(catPath, { recursive: true, force: true });
    res.json({ success: true, message: 'Categoria eliminata' });
  } else {
    res.status(404).json({ error: 'Categoria non trovata' });
  }
});

// 4. POST /api/portfolio/upload (Carica una nuova immagine in una categoria)
app.post('/api/portfolio/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });
  res.json({ 
    success: true, 
    url: `/uploads/portfolio/${encodeURIComponent(req.body.category)}/${encodeURIComponent(req.file.filename)}` 
  });
});

// 5. DELETE /api/portfolio/image (Elimina una singola immagine)
app.delete('/api/portfolio/image', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL mancante' });
  
  try {
    const relativePath = decodeURIComponent(url.replace(/^\/uploads\//, ''));
    const absolutePath = path.join(__dirname, 'uploads', relativePath);
    
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      res.json({ success: true, message: 'Immagine eliminata' });
    } else {
      res.status(404).json({ error: 'Immagine non trovata sul server' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione' });
  }
});

// 6. GET & POST config (Gestione pagina attiva: Chi Siamo / Portfolio)
const CONFIG_FILE = path.join(__dirname, 'uploads', 'config.json');
const ACTIVE_FILE = path.join(__dirname, 'uploads', 'analytics_active.json');
const HISTORY_FILE = path.join(__dirname, 'uploads', 'analytics_history.json');

app.get('/api/config', (req, res) => {
  if (fs.existsSync(CONFIG_FILE)) {
    res.json(JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')));
  } else {
    res.json({ pageMode: 'chisiamo' });
  }
});

app.post('/api/config', (req, res) => {
  const config = req.body.config || req.body;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  res.json({ success: true });
});

// Analytics Helper functions
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
};

const handleAnalyticsPing = (req, res) => {
  const data = req.body || {};
  const sessionId = data.sessionId ? String(data.sessionId).trim() : '';
  if (!sessionId) return res.status(400).json({ error: 'Session ID mancante' });

  const now = Math.floor(Date.now() / 1000);
  const ip = getClientIp(req);

  let activeSessions = {};
  let history = [];
  if (fs.existsSync(ACTIVE_FILE)) {
    try { activeSessions = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8')) || {}; } catch(e) {}
  }
  if (fs.existsSync(HISTORY_FILE)) {
    try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) || []; } catch(e) {}
  }

  // Cleanup stale active sessions
  const updatedActive = {};
  for (const [sid, sess] of Object.entries(activeSessions)) {
    if (now - (sess.lastPing || 0) > 45) {
      const hItem = history.find(h => h.sessionId === sid && h.status === 'online');
      if (hItem) {
        hItem.status = 'ended';
        hItem.endTime = sess.lastPing;
        hItem.durationSeconds = Math.max(1, sess.lastPing - sess.firstSeen);
      }
    } else {
      updatedActive[sid] = sess;
    }
  }

  const page = data.page || '/';
  const referrer = data.referrer || 'Diretto';
  const deviceType = data.deviceType || 'Desktop';
  const os = data.os || 'Unknown OS';
  const browser = data.browser || 'Unknown Browser';
  const screen = data.screen || '';
  const language = data.language || 'it';
  const theme = data.theme || 'dark';
  const visitorId = data.visitorId || sessionId;

  if (updatedActive[sessionId]) {
    const existing = updatedActive[sessionId];
    const pages = existing.pages || [];
    if (pages.length === 0 || pages[pages.length - 1] !== page) {
      pages.push(page);
    }
    updatedActive[sessionId] = {
      ...existing,
      currentPage: page,
      lastPing: now,
      pageViews: pages.length,
      pages,
      theme,
      language
    };
  } else {
    updatedActive[sessionId] = {
      sessionId,
      visitorId,
      ip,
      deviceType,
      os,
      browser,
      screen,
      currentPage: page,
      referrer,
      language,
      theme,
      firstSeen: now,
      lastPing: now,
      pageViews: 1,
      pages: [page]
    };
  }

  const foundHistory = history.find(h => h.sessionId === sessionId);
  if (foundHistory) {
    const hPages = foundHistory.pages || [];
    if (hPages.length === 0 || hPages[hPages.length - 1] !== page) {
      hPages.push(page);
    }
    foundHistory.lastPage = page;
    foundHistory.pageViews = hPages.length;
    foundHistory.pages = hPages;
    foundHistory.endTime = now;
    foundHistory.durationSeconds = Math.max(1, now - foundHistory.startTime);
    foundHistory.status = 'online';
    foundHistory.theme = theme;
    foundHistory.language = language;
  } else {
    history.unshift({
      sessionId,
      visitorId,
      ip,
      deviceType,
      os,
      browser,
      screen,
      landingPage: page,
      lastPage: page,
      pageViews: 1,
      pages: [page],
      referrer,
      language,
      theme,
      startTime: now,
      endTime: now,
      durationSeconds: 1,
      status: 'online'
    });
    if (history.length > 1500) history = history.slice(0, 1500);
  }

  fs.writeFileSync(ACTIVE_FILE, JSON.stringify(updatedActive, null, 2));
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

  res.json({ success: true, activeCount: Object.keys(updatedActive).length });
};

const handleAnalyticsLeave = (req, res) => {
  const sessionId = req.body?.sessionId;
  if (sessionId && fs.existsSync(ACTIVE_FILE)) {
    try {
      const activeSessions = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8')) || {};
      if (activeSessions[sessionId]) {
        delete activeSessions[sessionId];
        fs.writeFileSync(ACTIVE_FILE, JSON.stringify(activeSessions, null, 2));
      }
      if (fs.existsSync(HISTORY_FILE)) {
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) || [];
        const now = Math.floor(Date.now() / 1000);
        const item = history.find(h => h.sessionId === sessionId);
        if (item) {
          item.status = 'ended';
          item.endTime = now;
          item.durationSeconds = Math.max(1, now - item.startTime);
          fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        }
      }
    } catch(e) {}
  }
  res.json({ success: true });
};

const handleGetAnalytics = (req, res) => {
  let activeSessions = {};
  let history = [];
  if (fs.existsSync(ACTIVE_FILE)) {
    try { activeSessions = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8')) || {}; } catch(e) {}
  }
  if (fs.existsSync(HISTORY_FILE)) {
    try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) || []; } catch(e) {}
  }

  const now = Math.floor(Date.now() / 1000);
  const cleanActive = {};
  let historyModified = false;
  for (const [sid, sess] of Object.entries(activeSessions)) {
    if (now - (sess.lastPing || 0) > 45) {
      const hItem = history.find(h => h.sessionId === sid && h.status === 'online');
      if (hItem) {
        hItem.status = 'ended';
        hItem.endTime = sess.lastPing;
        hItem.durationSeconds = Math.max(1, sess.lastPing - sess.firstSeen);
        historyModified = true;
      }
    } else {
      cleanActive[sid] = sess;
    }
  }

  if (Object.keys(cleanActive).length !== Object.keys(activeSessions).length) {
    fs.writeFileSync(ACTIVE_FILE, JSON.stringify(cleanActive, null, 2));
  }
  if (historyModified) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = Math.floor(todayStart.getTime() / 1000);

  const totalVisits = history.length;
  let todayVisits = 0;
  let totalDuration = 0;
  const deviceBreakdown = { Desktop: 0, Mobile: 0, Tablet: 0 };
  const pageCounts = {};

  history.forEach(h => {
    if ((h.startTime || 0) >= todayTimestamp) todayVisits++;
    totalDuration += (h.durationSeconds || 0);
    const dev = h.deviceType || 'Desktop';
    deviceBreakdown[dev] = (deviceBreakdown[dev] || 0) + 1;
    const landing = h.landingPage || '/';
    pageCounts[landing] = (pageCounts[landing] || 0) + 1;
  });

  const avgDuration = totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0;

  res.json({
    activeVisitors: Object.values(cleanActive),
    history,
    stats: {
      activeCount: Object.keys(cleanActive).length,
      totalVisits,
      todayVisits,
      avgDurationSeconds: avgDuration,
      deviceBreakdown,
      topPages: pageCounts
    }
  });
};

const handleClearHistory = (req, res) => {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
  res.json({ success: true, message: 'Cronologia azzerata con successo' });
};

// Unified /api.php route support for local Node server
app.all('/api.php', (req, res) => {
  const action = req.query.action || '';
  if (action === 'verifyPassword') {
    const pwd = req.body?.password || '';
    if (pwd === 'fotoextracolor@100') {
      return res.json({ success: true });
    }
    return res.status(401).json({ success: false, error: 'Password errata' });
  }
  if (action === 'trackPing') return handleAnalyticsPing(req, res);
  if (action === 'trackLeave') return handleAnalyticsLeave(req, res);
  if (action === 'getAnalytics') return handleGetAnalytics(req, res);
  if (action === 'clearAnalyticsHistory') return handleClearHistory(req, res);
  if (action === 'getConfig') {
    if (fs.existsSync(CONFIG_FILE)) {
      return res.json(JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')));
    }
    return res.json({ pageMode: 'chisiamo' });
  }
  if (action === 'saveConfig') {
    const config = req.body?.config || req.body;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Azione non supportata su Node server' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server Node.js per gestione admin in esecuzione sulla porta ${PORT}`);
});
