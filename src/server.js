import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Runner } from './runner.js';
import { listProjects, createProject, updateProject, detail, exportProject, artifact } from './store.js';
import { loadConfig, saveConfig, redact } from './config.js';
import { doctor, gatewayModels } from './integrations.js';

export async function readBody(req) {
  let bytes = 0; const chunks = [];
  for await (const chunk of req) { bytes += chunk.length; if (bytes > 131072) throw new Error('Request exceeds 128 KB'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function startServer({ port = 4317, runner = new Runner() } = {}) {
  await runner.recover();
  const token = randomBytes(32).toString('hex');
  const assets = new Map(['/index.html', '/app.js', '/style.css'].map(path => [path, fileURLToPath(new URL(`../web${path}`, import.meta.url))]));
  let origin;
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const send = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
    try {
      if (req.headers.host !== new URL(origin).host) return send(403, { error: 'Invalid Host' });
      if (req.headers.origin && req.headers.origin !== origin) return send(403, { error: 'Cross-origin requests are forbidden' });
      if (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])) return send(403, { error: 'Cross-site requests are forbidden' });
      const url = new URL(req.url, origin);
      const path = url.pathname;
      const api = path.startsWith('/api/');
      if (api) {
        const received = req.headers['x-workbench-token'];
        if (typeof received !== 'string' || received.length !== token.length || !timingSafeEqual(Buffer.from(received), Buffer.from(token))) return send(401, { error: 'Open the dashboard from its local address' });
        if (!['GET', 'POST', 'PATCH'].includes(req.method)) return send(405, { error: 'Method not allowed' });
        if (req.method !== 'GET' && !req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'Use application/json' });
      }
      if (req.method === 'GET' && (path === '/' || assets.has(path))) {
        const asset = path === '/' ? '/index.html' : path;
        let body = await readFile(assets.get(asset));
        if (asset === '/index.html') body = Buffer.from(body.toString().replace('__WORKBENCH_TOKEN__', token));
        res.writeHead(200, { 'Content-Type': asset.endsWith('.html') ? 'text/html; charset=utf-8' : asset.endsWith('.js') ? 'text/javascript' : 'text/css' }); res.end(body); return;
      }
      if (path === '/api/projects' && req.method === 'GET') return send(200, await listProjects());
      if (path === '/api/projects' && req.method === 'POST') return send(201, await createProject(await readBody(req)));
      if (path === '/api/config' && req.method === 'GET') return send(200, { ...await loadConfig(), apiKeyConfigured: Boolean(process.env.OMNIROUTE_API_KEY) });
      if (path === '/api/config' && req.method === 'POST') return send(200, await saveConfig(await readBody(req)));
      if (path === '/api/models' && req.method === 'GET') return send(200, await gatewayModels());
      if (path === '/api/doctor' && req.method === 'GET') return send(200, await doctor());
      const match = /^\/api\/projects\/([^/]+)(?:\/(export|runs|artifact))?$/.exec(path);
      if (!match) return send(404, { error: 'Not found' });
      const [, id, action] = match;
      if (!action && req.method === 'GET') return send(200, await detail(id));
      if (!action && req.method === 'PATCH') return send(200, await updateProject(id, await readBody(req)));
      if (action === 'export' && req.method === 'GET') return send(200, await exportProject(id));
      if (action === 'runs' && req.method === 'POST') return send(202, await runner.start(id, await readBody(req)));
      if (action === 'artifact' && req.method === 'GET') {
        const type = url.searchParams.get('type'); const file = await artifact(id, url.searchParams.get('run'), type);
        res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${type}"` });
        const stream = createReadStream(file); stream.on('error', () => res.destroy()); stream.pipe(res); return;
      }
      send(405, { error: 'Method not allowed' });
    } catch (error) {
      if (!res.headersSent) send(400, { error: redact(error.code === 'ENOENT' ? 'File or project not found' : error.message) }); else res.destroy();
    }
  });
  server.requestTimeout = 15000; server.headersTimeout = 10000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  origin = `http://127.0.0.1:${server.address().port}`;
  return { server, origin, runner };
}
