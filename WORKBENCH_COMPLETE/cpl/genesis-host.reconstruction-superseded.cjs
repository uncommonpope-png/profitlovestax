'use strict';

/**
 * SUPERSEDED (Assembly Phase 2, 2026-10-20) — DO NOT RUN.
 * The ORIGINAL genesis-host.cjs (buyasoul-ai/buyasoul-cpl, host/, 10,625 B)
 * was recovered and now runs as cpl/host/genesis-host.cjs, extended with
 * the persisted buildings store (host/world-state.cjs). This file is kept
 * in-tree for history only.
 *
 * genesis-host.cjs — CPL GenesisHost (RECONSTRUCTION, built 2026-10-20)
 *
 * The original genesis-host.cjs existed only on the author's machine; the
 * repo root .gitignore ("*.cjs") kept it out of every commit, and GitHub
 * code search finds no copy in any uncommonpope-png repo. This minimal,
 * dependency-free reconstruction satisfies the contract the workbench
 * actually uses (verified in WORKBENCH_COMPLETE/workbench/server.ts):
 *
 *   - Spawned as: node genesis-host.cjs  (cwd = WORKBENCH_COMPLETE/cpl)
 *     env: PORT=3457, GENESIS_PORT=3457, GENESIS_TOKEN=<ring token>
 *   - GET  /health          — unauthenticated liveness probe (server.ts probe())
 *   - GET  /mcp/health      — probed with genesisHeaders()
 *   - GET  /mcp/status      — workbench reads data.result || data
 *   - GET  /mcp/spawn       — workbench reads result.souls / result.count
 *   - POST /mcp/spawn       — registers a soul (in-memory)
 *   - GET  /mcp/memories    — witness memory list (empty in reconstruction)
 *   - POST /mcp/execute     — honest stub: reports not-implemented
 *   - GET  /genesis-runtime.js | .json — public runtime manifest (per README)
 *   - WS   /thoughts, /sanctum — upgrade accepted, stream held open
 *
 * Auth: /mcp/* requires the GENESIS_TOKEN ring (Authorization: Bearer <t>
 * or x-api-key: <t>) when a token is configured — mirroring the workbench's
 * genesisHeaders() and startCPL() token contract.
 */

const http = require('http');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || process.env.GENESIS_PORT || '3457', 10);
const TOKEN = process.env.GENESIS_TOKEN || '';
const PROFILE = process.env.GENESIS_PROFILE || 'desktop';
const startedAt = Date.now();
const souls = [];

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function authorized(req) {
  if (!TOKEN) return true;
  const auth = String(req.headers.authorization || '');
  const bearer = auth.replace(/^Bearer\s+/i, '');
  return bearer === TOKEN || req.headers['x-api-key'] === TOKEN;
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const p = url.pathname;

  // Public liveness — the workbench's probe() hits this unauthenticated.
  if (p === '/health') {
    return sendJson(res, 200, { ok: true, service: 'genesis-host', port: PORT, uptimeMs: Date.now() - startedAt, ts: new Date().toISOString() });
  }

  // Public runtime manifest (per cpl/README.md).
  if (p === '/genesis-runtime.json') {
    return sendJson(res, 200, { name: 'genesis-host', profile: PROFILE, port: PORT, reconstruction: true, routes: ['/health', '/mcp/health', '/mcp/status', '/mcp/execute', '/mcp/memories', '/mcp/spawn', '/thoughts', '/sanctum'] });
  }
  if (p === '/genesis-runtime.js') {
    const js = `window.GENESIS_RUNTIME = ${JSON.stringify({ port: PORT, profile: PROFILE, reconstruction: true })};`;
    res.writeHead(200, { 'Content-Type': 'application/javascript', 'Content-Length': Buffer.byteLength(js) });
    return res.end(js);
  }

  if (p.startsWith('/mcp/')) {
    if (!authorized(req)) return sendJson(res, 401, { ok: false, error: 'GENESIS_RING: unauthorized' });

    if (p === '/mcp/health') {
      return sendJson(res, 200, { ok: true, status: 'healthy', service: 'genesis-host', souls: souls.length, uptimeMs: Date.now() - startedAt });
    }
    if (p === '/mcp/status') {
      const status = { online: true, service: 'genesis-host', port: PORT, souls: souls.length, uptimeMs: Date.now() - startedAt, reconstruction: true };
      return sendJson(res, 200, { ...status, result: status });
    }
    if (p === '/mcp/spawn' && req.method === 'GET') {
      const result = { souls, count: souls.length };
      return sendJson(res, 200, { ...result, result });
    }
    if (p === '/mcp/spawn' && req.method === 'POST') {
      const body = await readBody(req);
      const soul = { id: body.id || `soul_${Date.now().toString(36)}_${souls.length}`, name: body.name || 'unnamed', ...body, spawnedAt: new Date().toISOString() };
      souls.push(soul);
      return sendJson(res, 200, { ok: true, soul, result: soul });
    }
    if (p === '/mcp/memories') {
      const result = { memories: [], count: 0 };
      return sendJson(res, 200, { ...result, result });
    }
    if (p === '/mcp/execute' && req.method === 'POST') {
      const body = await readBody(req);
      const result = { ok: false, executed: false, note: 'genesis-host reconstruction: execution engine not present in repo — health/spawn surface only', echo: body ? Object.keys(body) : [] };
      return sendJson(res, 200, { ...result, result });
    }
    return sendJson(res, 404, { ok: false, error: `unknown mcp route: ${p}` });
  }

  return sendJson(res, 404, { ok: false, error: `unknown path: ${p}` });
});

// Minimal WebSocket accept for /thoughts and /sanctum (RFC 6455 handshake;
// frames are ignored except ping -> pong and close). No external deps.
server.on('upgrade', (req, socket) => {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  if (url.pathname !== '/thoughts' && url.pathname !== '/sanctum') {
    socket.destroy();
    return;
  }
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  const accept = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  socket.on('data', (buf) => {
    // Minimal frame scan: respond to ping (0x9) with pong (0xA), close on 0x8.
    let i = 0;
    while (i + 2 <= buf.length) {
      const opcode = buf[i] & 0x0f;
      const len = buf[i + 1] & 0x7f;
      if (opcode === 0x9) { try { socket.write(Buffer.from([0x8a, 0])); } catch {} }
      if (opcode === 0x8) { try { socket.end(); } catch {} return; }
      i += 2 + (len === 126 ? 2 : len === 127 ? 8 : 0) + 4 + len; // masked client frames
      if (len >= 126) break; // bail on complex frames; stream stays open
    }
  });
  socket.on('error', () => { try { socket.destroy(); } catch {} });
});

server.listen(PORT, () => {
  console.log(`[GENESIS-HOST] (reconstruction) listening on :${PORT} profile=${PROFILE} auth=${TOKEN ? 'ring' : 'open'}`);
});
