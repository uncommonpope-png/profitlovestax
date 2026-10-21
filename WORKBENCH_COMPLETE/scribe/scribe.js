'use strict';
/**
 * SCRIBE entry — Gen3 core (lib/soul-scribe.js) + UMP compatibility layer.
 *
 * GSK's bridge (gsk-core/brain/scribe_bridge.js) speaks:
 *   POST /ump/remember  {content,type,tags}      -> {success,id}
 *   POST /ump/recall    {query,limit}            -> {results:[{content,...}]}
 *   POST /ask           {query}                  -> {response}
 *   POST /invoke        {skill,params}           -> REDBUTTON-lite dispatch
 * Core keeps its native routes too (/ping /health /status /memories /witness /recall /key).
 */
const http = require('http');
const ScribeSoul = require('./lib/soul-scribe');

const PORT = parseInt(process.env.SCRIBE_PORT || process.env.PORT || '4000', 10);
const KEY = process.env.SCRIBE_KEY || null;

const scribe = new ScribeSoul({ port: PORT, apiKey: KEY });

// REDBUTTON-lite: the eight witness skills mapped onto core ops.
const SKILLS = {
  memory_classify: (p) => ({ classified: true, class: p.class || 'episode', id: (scribe.record({ type: 'classification', content: p.content || '', tags: p.tags || [] }) || {}).id }),
  fact_extractor: (p) => ({ facts: [String(p.text || p.content || '').slice(0, 500)] }),
  lesson_validator: (p) => ({ valid: !!p.lesson, lesson: p.lesson || null }),
  temporal_truth: (p) => ({ observed_at: new Date().toISOString(), valid_from: p.from || null, domain: p.domain || 'general' }),
  contradiction_detector: (p) => {
    const hits = scribe.recall(String(p.claim || ''), 25).filter(m => String(m.content || '').toLowerCase() !== String(p.claim || '').toLowerCase());
    return { contradictions: hits.length ? hits.map(h => h.id) : [] };
  },
  reflection_label: (p) => ({ label: p.label || 'observation' }),
  continuity_tester: () => ({ continuous: scribe.memories.length > 0, memories: scribe.memories.length }),
  working_memory: (p) => ({ recent: scribe.recall(p.query || '', 7) }),
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Scribe-Key, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  const readBody = () => new Promise((res2, rej) => {
    let d = '', n = 0;
    req.on('data', c => { n += c.length; if (n > 1048576) req.destroy(); d += c; });
    req.on('end', () => { try { res2(d ? JSON.parse(d) : {}); } catch (e) { rej(e); } });
    req.on('error', rej);
  });

  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (pathname !== '/ping' && !scribe.checkAuth(req)) {
      return send(401, { error: 'Unauthorized. Provide X-API-Key header.' });
    }

    // ── UMP COMPATIBILITY LAYER (what GSK's bridge actually calls) ──
    if (req.method === 'POST' && pathname === '/ump/remember') {
      const body = await readBody();
      if (!body.content) return send(400, { error: 'content required' });
      const mem = scribe.record({ type: body.type || 'episode', content: body.content, source: body.source || 'gsk', tags: body.tags || [] });
      return send(200, { success: true, id: mem.id });
    }
    if (req.method === 'POST' && pathname === '/ump/recall') {
      const body = await readBody();
      const results = scribe.recall(body.query || '', body.limit || 10);
      return send(200, { results, count: results.length });
    }
    if (req.method === 'POST' && pathname === '/ask') {
      const body = await readBody();
      const q = String(body.query || body.message || '');
      const hits = scribe.recall(q, 5);
      const response = hits.length
        ? `Witness memory (${hits.length}): ` + hits.map(h => `[${h.type}] ${String(h.content || '').slice(0, 140)}`).join(' | ')
        : 'I hold no witnessed memory of that yet — ask me again once I have seen more.';
      return send(200, { response, results: hits.length });
    }
    if (req.method === 'POST' && pathname === '/invoke') {
      const body = await readBody();
      const fn = SKILLS[body.skill];
      if (!fn) return send(200, { ok: false, error: `skill '${body.skill}' unavailable in lite kernel`, available: Object.keys(SKILLS) });
      return send(200, { ok: true, result: fn(body.params || {}) });
    }

    // ── Native Gen3 routes delegate to core instance ──
    if (req.method === 'GET' && pathname === '/ping') return send(200, { alive: true, name: 'SCRIBE', ts: scribe.now() });
    if (req.method === 'GET' && pathname === '/health') return send(200, { status: 'alive', ...scribe.getStats() });
    if (req.method === 'GET' && pathname === '/status') return send(200, scribe.getStats());
    if (req.method === 'GET' && pathname === '/memories') { const lim = parseInt(url.searchParams.limit) || 20; return send(200, { memories: scribe.memories.slice(-lim), total: scribe.memories.length }); }
    if (req.method === 'POST' && pathname === '/witness') {
      const b = await readBody();
      if (!b.content) return send(400, { error: 'content is required' });
      const mem = scribe.record({ type: b.type || 'observation', content: b.content, source: b.source || 'user', tags: b.tags || [] });
      return send(201, { success: true, memory: mem });
    }
    if (req.method === 'POST' && pathname === '/recall') {
      const b = await readBody();
      const r = scribe.recall(b.query || '', b.limit || 10);
      return send(200, { results: r, count: r.length });
    }

    send(404, { error: 'Not found', hint: 'UMP: /ump/remember /ump/recall /ask /invoke · native: /witness /recall /memories /status /health /ping' });
  } catch (e) {
    send(500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`[SCRIBE] Witness online :${PORT} (UMP-compatible) memories=${scribe.memories.length}`);
});
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
