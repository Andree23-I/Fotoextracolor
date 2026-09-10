import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

export function viteApiPlugin() {
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  const portfolioDir = path.join(uploadsDir, 'portfolio');
  const configFile = path.join(uploadsDir, 'config.json');
  const servicesFile = path.join(uploadsDir, 'services.json');
  const activeFile = path.join(uploadsDir, 'analytics_active.json');
  const historyFile = path.join(uploadsDir, 'analytics_history.json');
  const orderFile = path.join(portfolioDir, 'categories_order.json');

  // Ensure base uploads directories exist
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(portfolioDir)) fs.mkdirSync(portfolioDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const category = (req.body && req.body.category) || 'Uncategorized';
      const catPath = path.join(portfolioDir, category);
      if (!fs.existsSync(catPath)) {
        fs.mkdirSync(catPath, { recursive: true });
      }
      cb(null, catPath);
    },
    filename: (req, file, cb) => {
      const sanitized = file.originalname.replace(/\s+/g, '_');
      cb(null, `${Date.now()}-${sanitized}`);
    }
  });
  const upload = multer({ storage });

  return {
    name: 'vite-api-php-mock-middleware',
    configureServer(server) {
      // Use connect middleware
      server.middlewares.use((req, res, next) => {
        const parsedUrl = new URL(req.url, 'http://localhost');
        if (parsedUrl.pathname !== '/api.php' && !parsedUrl.pathname.startsWith('/api/')) {
          return next();
        }

        let action = parsedUrl.searchParams.get('action') || '';
        if (!action && parsedUrl.pathname.startsWith('/api/')) {
          action = parsedUrl.pathname.replace(/^\/api\//, '');
        }

        // Helper response methods
        const sendJson = (statusCode, data) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end(JSON.stringify(data));
        };

        const getRequestBody = () => {
          return new Promise((resolve, reject) => {
            if (req.body) return resolve(req.body);
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              if (!body) return resolve({});
              try {
                resolve(JSON.parse(body));
              } catch (e) {
                resolve({});
              }
            });
            req.on('error', reject);
          });
        };

        // Handle preflight
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          return res.end();
        }

        // 1. getConfig
        if (action === 'getConfig') {
          if (fs.existsSync(configFile)) {
            try {
              return sendJson(200, JSON.parse(fs.readFileSync(configFile, 'utf8')));
            } catch {
              return sendJson(200, { pageMode: 'chisiamo' });
            }
          }
          return sendJson(200, { pageMode: 'chisiamo' });
        }

        // 2. saveConfig
        if (action === 'saveConfig') {
          getRequestBody().then(data => {
            const config = data.config || data;
            fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
            sendJson(200, { success: true });
          }).catch(() => sendJson(500, { error: 'Errore nel salvataggio della configurazione' }));
          return;
        }

        // 3. getServices
        if (action === 'getServices') {
          if (fs.existsSync(servicesFile)) {
            try {
              return sendJson(200, JSON.parse(fs.readFileSync(servicesFile, 'utf8')));
            } catch {
              return sendJson(200, { it: [], en: [] });
            }
          }
          return sendJson(200, { it: [], en: [] });
        }

        // 4. saveServices
        if (action === 'saveServices') {
          getRequestBody().then(data => {
            if (data.services) {
              fs.writeFileSync(servicesFile, JSON.stringify(data.services, null, 2), 'utf8');
              sendJson(200, { success: true });
            } else {
              sendJson(400, { error: 'Dati mancanti' });
            }
          }).catch(() => sendJson(500, { error: 'Errore nel salvataggio dei servizi' }));
          return;
        }

        // 5. getPortfolio
        if (action === 'getPortfolio') {
          try {
            let categories = [];
            const imagesByCategory = {};
            let customOrder = [];

            if (fs.existsSync(orderFile)) {
              try {
                customOrder = JSON.parse(fs.readFileSync(orderFile, 'utf8')) || [];
              } catch {}
            }

            if (fs.existsSync(portfolioDir)) {
              const items = fs.readdirSync(portfolioDir, { withFileTypes: true });
              for (const item of items) {
                if (item.isDirectory()) {
                  const categoryName = item.name;
                  categories.push(categoryName);
                  const catId = categoryName.toLowerCase().replace(/\s+/g, '');
                  imagesByCategory[catId] = [];

                  const catPath = path.join(portfolioDir, categoryName);
                  const files = fs.readdirSync(catPath);
                  for (const file of files) {
                    if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                      imagesByCategory[catId].push(
                        `/uploads/portfolio/${encodeURIComponent(categoryName)}/${encodeURIComponent(file)}`
                      );
                    }
                  }
                }
              }
            }

            if (customOrder && customOrder.length > 0) {
              categories.sort((a, b) => {
                let posA = customOrder.indexOf(a);
                let posB = customOrder.indexOf(b);
                if (posA === -1) posA = 9999;
                if (posB === -1) posB = 9999;
                return posA - posB;
              });
            }

            return sendJson(200, { categories, imagesByCategory });
          } catch (e) {
            console.error('API getPortfolio error:', e);
            return sendJson(500, { error: 'Errore durante la lettura del portfolio' });
          }
        }

        // 6. reorderCategories
        if (action === 'reorderCategories') {
          getRequestBody().then(data => {
            const order = data.order || [];
            if (Array.isArray(order) && order.length > 0) {
              fs.writeFileSync(orderFile, JSON.stringify(order, null, 2), 'utf8');
              sendJson(200, { success: true });
            } else {
              sendJson(400, { error: 'Ordine non valido' });
            }
          }).catch(() => sendJson(500, { error: 'Errore nel riordinamento categorie' }));
          return;
        }

        // 7. createCategory
        if (action === 'createCategory') {
          getRequestBody().then(data => {
            const name = (data.name || '').trim();
            if (!name) return sendJson(400, { error: 'Nome categoria mancante' });
            const catPath = path.join(portfolioDir, name);
            if (!fs.existsSync(catPath)) {
              fs.mkdirSync(catPath, { recursive: true });
              sendJson(200, { success: true, message: 'Categoria creata' });
            } else {
              sendJson(400, { error: 'Categoria già esistente' });
            }
          }).catch(() => sendJson(500, { error: 'Errore creazione categoria' }));
          return;
        }

        // 8. deleteCategory
        if (action === 'deleteCategory') {
          const name = parsedUrl.searchParams.get('name') || '';
          if (!name) return sendJson(400, { error: 'Nome categoria mancante' });
          const catPath = path.join(portfolioDir, name);
          if (fs.existsSync(catPath)) {
            fs.rmSync(catPath, { recursive: true, force: true });
            return sendJson(200, { success: true, message: 'Categoria eliminata' });
          } else {
            return sendJson(404, { error: 'Categoria non trovata' });
          }
        }

        // 9. uploadImage
        if (action === 'uploadImage') {
          upload.single('photo')(req, res, (err) => {
            if (err) {
              return sendJson(500, { error: 'Errore upload: ' + err.message });
            }
            if (!req.file) {
              return sendJson(400, { error: 'Nessun file caricato' });
            }
            const category = req.body?.category || 'Uncategorized';
            return sendJson(200, {
              success: true,
              url: `/uploads/portfolio/${encodeURIComponent(category)}/${encodeURIComponent(req.file.filename)}`
            });
          });
          return;
        }

        // 10. deleteImage
        if (action === 'deleteImage') {
          getRequestBody().then(data => {
            const url = data.url || '';
            if (!url) return sendJson(400, { error: 'URL mancante' });
            const relPath = decodeURIComponent(url.replace(/^\/uploads\//, ''));
            const absPath = path.join(uploadsDir, relPath);
            if (fs.existsSync(absPath) && !fs.statSync(absPath).isDirectory()) {
              fs.unlinkSync(absPath);
              sendJson(200, { success: true, message: 'Immagine eliminata' });
            } else {
              sendJson(404, { error: 'Immagine non trovata sul server' });
            }
          }).catch(() => sendJson(500, { error: 'Errore eliminazione immagine' }));
          return;
        }

        // 11. trackPing
        if (action === 'trackPing') {
          getRequestBody().then(data => {
            const sessionId = (data.sessionId || '').toString().trim();
            if (!sessionId) return sendJson(400, { error: 'Session ID mancante' });

            const now = Math.floor(Date.now() / 1000);
            let activeSessions = {};
            let history = [];

            if (fs.existsSync(activeFile)) {
              try { activeSessions = JSON.parse(fs.readFileSync(activeFile, 'utf8')) || {}; } catch {}
            }
            if (fs.existsSync(historyFile)) {
              try { history = JSON.parse(fs.readFileSync(historyFile, 'utf8')) || []; } catch {}
            }

            // Cleanup stale sessions (>45s)
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
                ip: '127.0.0.1',
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
                ip: '127.0.0.1',
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

            fs.writeFileSync(activeFile, JSON.stringify(updatedActive, null, 2), 'utf8');
            fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');

            return sendJson(200, { success: true, activeCount: Object.keys(updatedActive).length });
          }).catch(() => sendJson(500, { error: 'Errore tracking' }));
          return;
        }

        // 12. trackLeave
        if (action === 'trackLeave') {
          getRequestBody().then(data => {
            const sessionId = data.sessionId;
            if (sessionId && fs.existsSync(activeFile)) {
              try {
                const activeSessions = JSON.parse(fs.readFileSync(activeFile, 'utf8')) || {};
                if (activeSessions[sessionId]) {
                  delete activeSessions[sessionId];
                  fs.writeFileSync(activeFile, JSON.stringify(activeSessions, null, 2), 'utf8');
                }
                if (fs.existsSync(historyFile)) {
                  const history = JSON.parse(fs.readFileSync(historyFile, 'utf8')) || [];
                  const now = Math.floor(Date.now() / 1000);
                  const item = history.find(h => h.sessionId === sessionId);
                  if (item) {
                    item.status = 'ended';
                    item.endTime = now;
                    item.durationSeconds = Math.max(1, now - item.startTime);
                    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
                  }
                }
              } catch {}
            }
            return sendJson(200, { success: true });
          }).catch(() => sendJson(200, { success: true }));
          return;
        }

        // 13. getAnalytics
        if (action === 'getAnalytics') {
          try {
            let activeSessions = {};
            let history = [];
            if (fs.existsSync(activeFile)) {
              try { activeSessions = JSON.parse(fs.readFileSync(activeFile, 'utf8')) || {}; } catch {}
            }
            if (fs.existsSync(historyFile)) {
              try { history = JSON.parse(fs.readFileSync(historyFile, 'utf8')) || []; } catch {}
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
              fs.writeFileSync(activeFile, JSON.stringify(cleanActive, null, 2), 'utf8');
            }
            if (historyModified) {
              fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
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

            return sendJson(200, {
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
          } catch (e) {
            console.error('API getAnalytics error:', e);
            return sendJson(500, { error: 'Errore calcolo statistiche' });
          }
        }

        // 14. clearAnalyticsHistory
        if (action === 'clearAnalyticsHistory') {
          fs.writeFileSync(historyFile, JSON.stringify([], null, 2), 'utf8');
          return sendJson(200, { success: true, message: 'Cronologia azzerata con successo' });
        }

        return sendJson(400, { error: 'Azione non valida: ' + action });
      });
    }
  };
}
