import type { Plugin, ViteDevServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.resolve(__dirname, 'src', 'data');
const IMAGES_DIR = path.resolve(__dirname, 'public', 'images');

function readJson(filename: string) {
  const raw = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
  return JSON.parse(raw);
}

function writeJson(filename: string, data: unknown) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function listImages(): { dirs: string[]; files: { path: string; dir: string; name: string }[] } {
  const dirs: string[] = [];
  const files: { path: string; dir: string; name: string }[] = [];

  if (!fs.existsSync(IMAGES_DIR)) return { dirs, files };

  const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    dirs.push(entry.name);
    const subPath = path.join(IMAGES_DIR, entry.name);
    const subFiles = fs.readdirSync(subPath, { withFileTypes: true });
    for (const f of subFiles) {
      if (!f.isFile()) continue;
      const ext = path.extname(f.name).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext)) continue;
      files.push({
        path: `/images/${entry.name}/${f.name}`,
        dir: entry.name,
        name: f.name,
      });
    }
  }
  return { dirs, files };
}

function parseBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    if (req.body) return resolve(req.body);
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve(null); }
    });
  });
}

function sendJson(res: any, data: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function sendError(res: any, message: string, status = 400) {
  sendJson(res, { error: message }, status);
}

export function dataApiPlugin(): Plugin {
  return {
    name: 'vite-data-api',
    configureServer(server: ViteDevServer) {
      if (server.config.command !== 'serve') return;

      server.middlewares.use('/api/', async (req, res, next) => {
        try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const url = new URL(req.url || '/', 'http://localhost');
        const p = url.pathname.replace(/^\/api\/?/, '').replace(/^\/+/, '');

        // --- Journal endpoints ---
        if (req.method === 'GET' && p === 'journal') {
          const entries = readJson('journal.json');
          sendJson(res, entries);
          return;
        }

        if (req.method === 'GET' && p.startsWith('journal/')) {
          const slug = p.slice('journal/'.length);
          const entries = readJson('journal.json');
          const entry = entries.find((e: any) => e.slug === slug) || null;
          sendJson(res, entry);
          return;
        }

        if (req.method === 'PUT' && p.startsWith('journal/')) {
          const slug = p.slice('journal/'.length);
          const index = parseInt(url.searchParams.get('index') || '', 10);
          const body = await parseBody(req);
          if (!body) { sendError(res, 'Invalid JSON body'); return; }
          const entries = readJson('journal.json');
          const idxBySlug = entries.findIndex((e: any) => e.slug === slug);
          const idx = idxBySlug >= 0 ? idxBySlug : (!isNaN(index) && index >= 0 && index < entries.length ? index : -1);
          if (idx >= 0) {
            entries[idx] = { ...entries[idx], ...body, slug };
          } else {
            entries.push({ ...body, slug });
          }
          writeJson('journal.json', entries);
          server.ws.send({ type: 'full-reload' });
          sendJson(res, { ok: true });
          return;
        }

        if (req.method === 'DELETE' && p.startsWith('journal/')) {
          const slug = p.slice('journal/'.length);
          const index = parseInt(url.searchParams.get('index') || '', 10);
          let entries = readJson('journal.json');
          const idxBySlug = entries.findIndex((e: any) => e.slug === slug);
          if (idxBySlug >= 0) {
            entries.splice(idxBySlug, 1);
          } else if (!isNaN(index) && index >= 0 && index < entries.length) {
            entries.splice(index, 1);
          }
          writeJson('journal.json', entries);
          server.ws.send({ type: 'full-reload' });
          sendJson(res, { ok: true });
          return;
        }

        // --- Albums endpoints ---
        if (req.method === 'GET' && p === 'albums') {
          const albums = readJson('albums.json');
          sendJson(res, albums);
          return;
        }

        if (req.method === 'PUT' && p.startsWith('albums/')) {
          const id = p.slice('albums/'.length);
          const body = await parseBody(req);
          if (!body) { sendError(res, 'Invalid JSON body'); return; }
          const albums = readJson('albums.json');
          const idx = albums.findIndex((a: any) => a.id === id);
          if (idx < 0) { sendError(res, 'Album not found', 404); return; }
          albums[idx] = { ...albums[idx], ...body, id };
          writeJson('albums.json', albums);
          server.ws.send({ type: 'full-reload' });
          sendJson(res, { ok: true });
          return;
        }

        // --- Images endpoint ---
        if (req.method === 'GET' && p === 'images') {
          sendJson(res, listImages());
          return;
        }

        // --- Settings endpoints ---
        if (req.method === 'GET' && p === 'settings') {
          const settings = readJson('settings.json');
          sendJson(res, settings);
          return;
        }

        if (req.method === 'PUT' && p === 'settings') {
          const body = await parseBody(req);
          if (!body) { sendError(res, 'Invalid JSON body'); return; }
          writeJson('settings.json', body);
          server.ws.send({ type: 'full-reload' });
          sendJson(res, { ok: true });
          return;
        }

        next();
        } catch (err: any) {
          console.error('[data-api] ERROR:', err.message, err.stack);
          sendError(res, err.message || 'Internal error', 500);
        }
      });
    },
  };
}
