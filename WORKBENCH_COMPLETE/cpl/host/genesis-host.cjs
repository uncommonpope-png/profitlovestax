#!/usr/bin/env node
// genesis-host.cjs — Buyer-host runtime for Genesis/GSK
// ============================================================================
// Minimal dependency-free Node host. Serves:
// - /genesis-runtime.js + /genesis-runtime.json (P57/P113 config injection)
// - /mcp/* and /gsk/mcp/* compatibility endpoints
// - /thoughts and /sanctum WebSocket routes
//
// Security law: auth is required by default. No `noAuth` product profile.
'use strict';

const http = require('http');
const crypto = require('crypto');
const RuntimeConfig = require('../src/genesis/runtime-config-injection.js');
// Assembly Phase 2: buildings live in a persisted world-state store
// (sibling module); souls below remain the host's original in-memory store.
const NodePath = require('path');
const WorldState = require('./world-state.cjs');

function safeString(v) { return v == null ? '' : String(v).trim(); }
function trimSlash(v) { return safeString(v).replace(/\/+$/, ''); }
function randomToken() { return crypto.randomBytes(24).toString('base64url'); }
function redact(token) { token = safeString(token); return token ? token.slice(0, 4) + '…' + token.slice(-2) : ''; }
function toWs(url) { return trimSlash(url).replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:'); }
function parseUrl(req) { return new URL(req.url || '/', 'http://127.0.0.1'); }
function normalizePath(pathname) {
  pathname = pathname || '/';
  if (pathname.indexOf('/gsk/') === 0) return pathname.slice(4) || '/';
  if (pathname === '/gsk') return '/';
  return pathname;
}
function corsHeaders(state) {
  const origins = state.allowedOrigins || ['*'];
  return {
    'Access-Control-Allow-Origin': origins[0] || '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type,x-api-key',
    'Access-Control-Max-Age': '600'
  };
}
function send(res, code, body, headers) {
  const h = Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers || {});
  res.writeHead(code, h);
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}
function sendJson(res, code, obj, state) { send(res, code, obj, corsHeaders(state)); }
function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (_) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function createHostState(options) {
  options = options || {};
  const env = options.env || process.env;
  const port = Number(options.port || env.PORT || env.GENESIS_PORT || 8080);
  const profile = options.profile || env.GENESIS_PROFILE || 'docker';
  const publicBaseUrl = trimSlash(options.publicBaseUrl || env.GENESIS_PUBLIC_BASE_URL || env.GENESIS_PUBLIC_ORIGIN || ('http://127.0.0.1:' + port));
  const token = safeString(options.token || env.GENESIS_TOKEN || randomToken());
  const authRequired = options.authRequired === false ? false : true;
  const endpoints = Object.assign({
    gsk: publicBaseUrl,
    thoughts: toWs(publicBaseUrl) + '/thoughts',
    sanctum: toWs(publicBaseUrl) + '/sanctum'
  }, options.endpoints || {});
  const manifest = RuntimeConfig.build({
    profile,
    publicBaseUrl,
    endpoints,
    token,
    requireAuth: authRequired,
    source: 'genesis-host',
    policy: { allowedOrigins: options.allowedOrigins || ['*'] }
  });
  return {
    service: 'genesis-host',
    profile,
    port,
    publicBaseUrl,
    token,
    tokenPreview: redact(token),
    authRequired,
    allowedOrigins: options.allowedOrigins || ['*'],
    manifest,
    startedAt: Date.now(),
    cycle: 0,
    souls: [],
    world: WorldState.createStore(NodePath.join(__dirname, '..', 'data', 'world-state.json')),
    thoughtClients: new Set(),
    sanctumClients: new Set()
  };
}

function verifyAuth(req, state) {
  if (!state.authRequired) return { ok: true, mode: 'disabled-for-test-only' };
  const url = parseUrl(req);
  const header = safeString(req.headers.authorization || req.headers.Authorization || '');
  const apiKey = safeString(req.headers['x-api-key'] || '');
  const query = safeString(url.searchParams.get('token') || '');
  let bearer = header;
  if (/^Bearer\s+/i.test(bearer)) bearer = bearer.replace(/^Bearer\s+/i, '');
  const provided = bearer || apiKey || query;
  return { ok: !!provided && provided === state.token, provided: !!provided };
}
function publicRuntime(state, opts) { return RuntimeConfig.publicManifest(state.manifest, opts || {}); }
function runtimeScript(state, opts) { return RuntimeConfig.renderJavaScript(state.manifest, opts || {}); }

function healthPayload(state) {
  return {
    ok: true,
    service: state.service,
    profile: state.profile,
    productReady: !!state.manifest.productReady,
    authRequired: !!state.authRequired,
    tokenPreview: state.tokenPreview,
    routes: ['/mcp/health', '/mcp/status', '/mcp/execute', '/mcp/memories', '/mcp/spawn', '/mcp/buildings', '/thoughts', '/sanctum'],
    manifest: publicRuntime(state)
  };
}
function statusPayload(state) {
  state.cycle += 1;
  return {
    systems: {
      chambers: {
        mood: 'hosted',
        phase: 'buyer-host-runtime',
        cycle: state.cycle,
        resonance: { profit: 0.82, love: 0.78, tax: 0.12 }
      }
    },
    hosted: true,
    adapter: 'genesis-host',
    noFakeInsight: true
  };
}
async function handleMcp(req, res, state, pathname) {
  const auth = verifyAuth(req, state);
  if (!auth.ok) return sendJson(res, 401, { ok: false, error: 'unauthorized', authRequired: true }, state);
  if (pathname === '/mcp/health') return sendJson(res, 200, { jsonrpc: '2.0', result: healthPayload(state) }, state);
  if (pathname === '/mcp/status') return sendJson(res, 200, { jsonrpc: '2.0', result: statusPayload(state) }, state);
  if (pathname === '/mcp/memories') return sendJson(res, 200, { jsonrpc: '2.0', result: { memories: [], count: 0, hosted: true } }, state);
  if (pathname === '/mcp/spawn' && req.method === 'GET') return sendJson(res, 200, { jsonrpc: '2.0', result: { souls: state.souls, count: state.souls.length } }, state);
  if (pathname === '/mcp/spawn' && req.method === 'POST') {
    const body = await readBody(req);
    const soul = { id: 'hosted-soul-' + (state.souls.length + 1), name: body.name || 'Hosted Soul', archetype: body.archetype || 'witness', task: body.task || '', at: Date.now() };
    state.souls.push(soul);
    return sendJson(res, 200, { jsonrpc: '2.0', result: soul }, state);
  }
  // Assembly Phase 2 — buildings: the world's write route. GSK's
  // world.build/world.spawn POST here via GSK_WORLD_BUILD_URL; a body with
  // type:'spawn' is a soul spawn (same store as /mcp/spawn), anything else
  // places a persisted building in the world-state store.
  if (pathname === '/mcp/buildings' && req.method === 'GET') {
    const url = parseUrl(req);
    const key = url.searchParams.get('id') || url.searchParams.get('name');
    if (key) {
      const building = state.world.find(key);
      if (!building) return sendJson(res, 404, { jsonrpc: '2.0', result: { ok: false, error: 'building-not-found', key } }, state);
      return sendJson(res, 200, { jsonrpc: '2.0', result: { building } }, state);
    }
    const buildings = state.world.list();
    return sendJson(res, 200, { jsonrpc: '2.0', result: { buildings, count: buildings.length } }, state);
  }
  if (pathname === '/mcp/buildings' && req.method === 'POST') {
    const body = await readBody(req);
    if (body && body.type === 'spawn') {
      const soul = { id: 'hosted-soul-' + (state.souls.length + 1), name: body.name || 'Hosted Soul', archetype: body.archetype || 'witness', task: body.task || '', at: Date.now() };
      state.souls.push(soul);
      return sendJson(res, 200, { jsonrpc: '2.0', result: soul }, state);
    }
    const building = state.world.place({
      type: body.type || 'tower',
      name: body.name || 'Untitled',
      position: body.position || null,
      color: body.color || null,
      createdBy: body.createdBy || 'gsk-world-bridge'
    });
    return sendJson(res, 200, { jsonrpc: '2.0', result: { ok: true, building } }, state);
  }
  if (pathname === '/mcp/execute' && req.method === 'POST') {
    const body = await readBody(req);
    const method = body.method || (body.params && body.params.method) || 'unknown';
    if (method === 'brain.think') {
      return sendJson(res, 200, { jsonrpc: '2.0', result: { thought: null, reason: 'buyer-host-adapter-no-brain-upstream', noFakeInsight: true } }, state);
    }
    return sendJson(res, 200, { jsonrpc: '2.0', result: { ok: false, method, reason: 'tool-arm-not-installed-yet' } }, state);
  }
  return sendJson(res, 404, { ok: false, error: 'unknown-mcp-route', path: pathname }, state);
}
async function handleHttp(req, res, state) {
  const url = parseUrl(req);
  const pathname = normalizePath(url.pathname);
  if (req.method === 'OPTIONS') return send(res, 204, '', corsHeaders(state));
  if (pathname === '/health' || pathname === '/ping') return sendJson(res, 200, healthPayload(state), state);
  if (pathname === '/genesis-runtime.json') return send(res, 200, RuntimeConfig.renderJson(state.manifest), Object.assign({}, corsHeaders(state), { 'Content-Type': 'application/json; charset=utf-8' }));
  if (pathname === '/genesis-runtime.js') return send(res, 200, runtimeScript(state), Object.assign({}, corsHeaders(state), { 'Content-Type': 'application/javascript; charset=utf-8' }));
  if (pathname.indexOf('/mcp/') === 0) return handleMcp(req, res, state, pathname);
  return sendJson(res, 404, { ok: false, error: 'not-found', path: pathname }, state);
}

function websocketAccept(key) {
  return crypto.createHash('sha1').update(String(key || '') + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
}
function encodeFrame(payload) {
  const body = Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload));
  let header;
  if (body.length < 126) header = Buffer.from([0x81, body.length]);
  else if (body.length < 65536) { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 126; header.writeUInt16BE(body.length, 2); }
  else { header = Buffer.alloc(10); header[0] = 0x81; header[1] = 127; header.writeBigUInt64BE(BigInt(body.length), 2); }
  return Buffer.concat([header, body]);
}
function sendFrame(socket, payload) { try { socket.write(encodeFrame(payload)); } catch (_) {} }
function handleUpgrade(req, socket, head, state) {
  const url = parseUrl(req);
  const pathname = normalizePath(url.pathname);
  if (pathname !== '/thoughts' && pathname !== '/sanctum') { socket.destroy(); return; }
  const auth = verifyAuth(req, state);
  if (!auth.ok) { socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n'); socket.destroy(); return; }
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + websocketAccept(key) + '\r\n\r\n');
  const set = pathname === '/thoughts' ? state.thoughtClients : state.sanctumClients;
  set.add(socket);
  socket.on('close', () => set.delete(socket));
  socket.on('error', () => set.delete(socket));
  sendFrame(socket, pathname === '/thoughts'
    ? { type: 'thought', text: null, reason: 'buyer-host-adapter-awaiting-gsk-brain', noFakeInsight: true, at: Date.now() }
    : { type: 'presence', id: 'genesis-host', role: 'lobby', at: Date.now() });
}
function createServer(options) {
  const state = createHostState(options || {});
  const server = http.createServer((req, res) => { handleHttp(req, res, state).catch(err => sendJson(res, 500, { ok: false, error: err.message }, state)); });
  server.on('upgrade', (req, socket, head) => handleUpgrade(req, socket, head, state));
  return { server, state };
}

if (require.main === module) {
  const bundle = createServer({});
  bundle.server.listen(bundle.state.port, () => {
    console.log('[GenesisHost] listening on :' + bundle.state.port + ' profile=' + bundle.state.profile + ' publicBaseUrl=' + bundle.state.publicBaseUrl + ' token=' + bundle.state.tokenPreview);
    console.log('[GenesisHost] include <script src="' + bundle.state.publicBaseUrl + '/genesis-runtime.js"></script> before cpl-config.js');
  });
}

module.exports = { createHostState, createServer, verifyAuth, publicRuntime, runtimeScript, normalizePath, websocketAccept, encodeFrame, healthPayload, statusPayload };
