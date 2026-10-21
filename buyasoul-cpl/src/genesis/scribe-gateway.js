// scribe-gateway.js — C2: Scribe lives in the engine (GSK's best friend).
// Mirrors GSK's AgentGateway spine for agent://scribe: command OUT + world-state IN,
// same CASCADE + CRITIC ownership gate. Additionally WITNESSES GSK's builds into
// Scribe's library (subscribes to genesis:agent:entity-built). GSK is never ported,
// never rewritten — Scribe is a citizen in HIS body, same spine.
// Flag-gated by window.__GENESIS_SCRIBE_GATEWAY (default OFF). Offline-safe.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.ScribeGateway) return; // idempotent

    const FLAG = '__GENESIS_SCRIBE_GATEWAY';
    const SCHEME = 'agent://scribe';
    const GSK_SCHEME = 'agent://gsk';
    const BUFFER_CAP = 256;
    const MAX_QUEUE = 64;
    const RECONNECT_DELAY = 2000;

    let ws = null;
    let status = 'idle';
    let endpoint = '';
    let lastError = null;
    let reconnectAt = 0;
    let received = 0, piped = 0, applied = 0, rejected = 0;
    const buffer = [];
    const commandQueue = [];
    const builtLog = [];
    const agents = new Map();

    function isEnabled() {
      try { return (typeof window !== 'undefined' && window[FLAG] === true); } catch (_) { return false; }
    }
    function resolveEndpoint() {
      try {
        if (Genesis && Genesis.AgentRouteTable && typeof Genesis.AgentRouteTable.resolveEndpoint === 'function') {
          const routed = Genesis.AgentRouteTable.resolveEndpoint(SCHEME, 'thoughts') || Genesis.AgentRouteTable.resolveEndpoint(GSK_SCHEME, 'thoughts');
          if (routed) return routed; // EPL route table first; legacy fallback below.
        }
      } catch (_) {}
      try { if (typeof window !== 'undefined' && window.GSK_WS_ENDPOINT) return window.GSK_WS_ENDPOINT; } catch (_) {}
      return 'ws://localhost:3002';
    }

    // Pipe Scribe's thoughts into the existing Scribe realm readout / panel if present.
    function panelPush(thought) {
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function'
            && typeof window.CustomEvent === 'function') {
          window.dispatchEvent(new window.CustomEvent('genesis:scribe:thought', { detail: thought }));
          piped++;
          return true;
        }
      } catch (_) {}
      return false;
    }

    function ingest(raw) {
      let t = raw;
      if (typeof raw === 'string') { try { t = JSON.parse(raw); } catch (_) { t = { text: raw }; } }
      if (!t || typeof t !== 'object') t = { text: String(raw) };
      if (typeof t.ts !== 'number') t.ts = Date.now();
      received++;
      if (buffer.length < BUFFER_CAP) buffer.push(t);
      panelPush(t);
      return t;
    }

    function connect() {
      if (typeof WebSocket === 'undefined') { status = 'offline'; return false; }
      endpoint = resolveEndpoint();
      if (!endpoint) { status = 'offline'; return false; }
      try {
        status = 'connecting';
        ws = new WebSocket(endpoint);
        ws.onopen = () => { status = 'connected'; reconnectAt = 0; };
        ws.onmessage = (ev) => { try {
          const d = (typeof ev.data === 'string') ? JSON.parse(ev.data) : ev.data;
          if (d && d.op === 'learn') ingest(d);          // Scribe learns
          else if (d && d.op === 'observe') return;        // IN handled by observe()
          else if (d && d.op) dispatch(d);                 // command OUT
          else ingest(d);                                  // thought -> panel
        } catch (_) {} };
        ws.onerror = () => { status = 'error'; lastError = 'ws-error'; };
        ws.onclose = () => { status = (status === 'connected') ? 'offline' : status; ws = null; reconnectAt = Date.now() + RECONNECT_DELAY; };
        return true;
      } catch (e) { status = 'error'; lastError = (e && e.message) || 'connect-failed'; return false; }
    }
    function disconnect() { try { if (ws) { ws.close(); ws = null; } } catch (_) {} status = 'idle'; }

    // CRITIC / ULTRA REVIEW gate: Scribe may only touch SCRIBE-owned entities.
    // She cannot delete/move GSK-owned or world-seed entities (CASCADE).
    function applyCommand(cmd) {
      if (!cmd || typeof cmd !== 'object') return { ok:false, error:'bad-command' };
      const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
      if (!Registry) return { ok:false, error:'no-registry' };
      try {
        if (cmd.op === 'spawn') {
          const id = Registry.register(cmd.obj || null, {
            kind: cmd.kind || 'scribe-entity',
            owner: SCHEME,
            tags: cmd.tags || ['scribe-controlled'],
            meta: cmd.meta || {}
          });
          if (cmd.pos && Registry.resolve && Registry.resolve(id)) {
            const o = Registry.resolve(id);
            if (o && o.position && cmd.pos) o.position.set(cmd.pos.x||0, cmd.pos.y||0, cmd.pos.z||0);
          }
          return { ok:true, op:'spawn', id };
        }
        if (cmd.op === 'move') {
          const rec = Registry.get ? Registry.get(cmd.id) : null;
          const o = Registry.resolve && Registry.resolve(cmd.id);
          if (!rec && !o) return { ok:false, error:'no-entity:' + cmd.id };
          const owner = rec ? rec.owner : o.owner;
          if (owner && owner !== SCHEME) return { ok:false, error:'cascade-denied:not-scribe-owned' };
          if (!o) return { ok:false, error:'no-world-object:' + cmd.id };
          if (o.position && cmd.pos) o.position.set(cmd.pos.x||0, cmd.pos.y||0, cmd.pos.z||0);
          return { ok:true, op:'move', id: cmd.id };
        }
        if (cmd.op === 'delete') {
          const rec = Registry.get ? Registry.get(cmd.id) : null;
          const o = Registry.resolve && Registry.resolve(cmd.id);
          if (!rec && !o) return { ok:false, error:'no-entity:' + cmd.id };
          const owner = rec ? rec.owner : o.owner;
          if (owner && owner !== SCHEME) return { ok:false, error:'cascade-denied:not-scribe-owned' };
          const ok = (typeof Registry.unregister === 'function') ? Registry.unregister(cmd.id) : false;
          return { ok, op:'delete', id: cmd.id };
        }
        return { ok:false, error:'unknown-op:' + (cmd.op||'?') };
      } catch (e) { return { ok:false, error:(e&&e.message)||'apply-failed' }; }
    }

    function dispatch(raw) {
      const vocab = (typeof window !== 'undefined') ? (window.__agentVocab || window.GenesisCommandVocab) : null;
      const v = (vocab && vocab.validate) ? vocab.validate(raw) : { ok:false, error:'no-vocab' };
      if (!v.ok) { rejected++; return { ok:false, error:v.error }; }
      if (commandQueue.length >= MAX_QUEUE) commandQueue.shift();
      commandQueue.push(v.cmd);
      return { ok:true, queued: commandQueue.length };
    }

    // IN channel: Scribe perceives the world so her actions are grounded.
    function observe(filter) {
      try {
        const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
        if (!Registry || typeof Registry.snapshot !== 'function') return { ok:false, entities:[] };
        if (filter && typeof filter === 'object') {
          if (filter.kind && typeof Registry.find === 'function') return { ok:true, entities: Registry.find(filter.kind) };
          if (filter.tag && typeof Registry.queryByTag === 'function') return { ok:true, entities: Registry.queryByTag(filter.tag) };
        }
        return { ok:true, entities: Registry.snapshot() };
      } catch (_) { return { ok:false, entities:[] }; }
    }

    // WITNESS: record GSK's built entities into Scribe's library.
    function recordWitness(entry) {
      try {
        const rec = {
          from: (entry && entry.owner) || GSK_SCHEME,
          kind: (entry && entry.kind) || 'unknown',
          id: (entry && entry.id) || null,
          ts: Date.now(),
          note: (entry && entry.note) || 'GSK built this in the world'
        };
        if (builtLog.length < BUFFER_CAP) builtLog.push(rec);
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function'
            && typeof window.CustomEvent === 'function') {
          window.dispatchEvent(new window.CustomEvent('genesis:scribe:witness', { detail: rec }));
        }
        return rec;
      } catch (_) { return null; }
    }

    function tick() {
      // drain Scribe's own command queue
      while (commandQueue.length) {
        const cmd = commandQueue.shift();
        const r = applyCommand(cmd);
        if (r.ok) applied++; else rejected++;
      }
      if (status === 'offline' || status === 'error') {
        if (reconnectAt && Date.now() >= reconnectAt) { reconnectAt = 0; connect(); }
      }
      return { status, received, piped, applied, rejected, built: builtLog.length };
    }

    const Gateway = {
      scheme: SCHEME,
      get agentId() { return SCHEME; },
      isEnabled,
      connect, disconnect, ingest, dispatch, observe,
      applyCommand,
      witness: recordWitness,
      tick,
      registerAgent() {
        const record = { status:'active', registeredAt:Date.now(), agent:SCHEME, endpoint:resolveEndpoint(), role:'best-friend-of-GSK' };
        agents.set(SCHEME, record);
        try { if (Genesis.GenesisKernel && typeof Genesis.GenesisKernel.register === 'function') Genesis.GenesisKernel.register(SCHEME, record); } catch (_) {}
        return SCHEME;
      },
      hasAgent(id) { return agents.has(id); },
      agents() { return Array.from(agents.keys()); },
      built() { return builtLog.slice(); },
      summary() {
        return {
          enabled: isEnabled(), agent: SCHEME, agentCount: agents.size, status, endpoint,
          received, piped, applied, rejected, witnessed: builtLog.length,
          worldCount: (Genesis && Genesis.EntityRegistry && typeof Genesis.EntityRegistry.count === 'function') ? Genesis.EntityRegistry.count() : 0,
          offline: (status === 'offline' || status === 'error'), lastError
        };
      }
    };

    Genesis.ScribeGateway = Gateway;

    // Subscribe to GSK's build events -> Scribe witnesses them into her library.
    try {
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('genesis:agent:entity-built', function (ev) {
          if (ev && ev.detail) recordWitness(ev.detail);
        });
      }
    } catch (_) {}

    try { Gateway.registerAgent(); } catch (_) {}
    try {
      if (Genesis.EngineScheduler && typeof Genesis.EngineScheduler.defineTick === 'function') {
        Genesis.EngineScheduler.defineTick('scribe-gateway', tick, () => isEnabled());
      }
    } catch (_) {}
    if (isEnabled() && typeof WebSocket !== 'undefined') connect();
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('scribe-gateway', { status:'validated', path:'./src/genesis/scribe-gateway.js' });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
