// AgentGateway — Layer D (M9 precursor) + Step 1 proper (the BODY).
// Hosts GSK as an in-engine agent. GSK = the brain (sovereign core);
// this = the body that receives him. GSK stays the brain; this adds the HOST.
// Flag-gated by window.__GENESIS_AGENT_GATEWAY. When OFF, this file is
// never imported (index.html guarded import) — ZERO delta on the live floor.
// When ON (Step 1: flag flipped ON in index.html): registers agent://gsk,
// opens a WS to window.GSK_WS_ENDPOINT (GSK thought-stream :3002), and
//   IN  — observe(): exposes EntityRegistry world-state so GSK's actions are grounded;
//   OUT — dispatch(): GSK -> agent://gsk -> EngineScheduler tick applies
//         spawn/move/delete entity commands to the world (the body ACTS);
//   panels — ingests thoughts into the existing #gsk-panel (window.__thoughtStream).
// EngineScheduler drives health + reconnect + command-drain. Fully OFFLINE-SAFE:
// no WS global / no endpoint / no panel => degraded buffer, never a throw.
// Does NOT port GSK, does NOT touch production CPL, does NOT push.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.AgentGateway) return; // idempotent

    const FLAG = '__GENESIS_AGENT_GATEWAY';
    const AGENT_SCHEME = 'agent://gsk';
    const DEFAULT_WS = 'ws://localhost:3002';
    const BUFFER_CAP = 256;
    const RECONNECT_DELAY = 2000;

    // Step 2 (CASCADE): the command vocabulary. The engine validates every op.
    let Vocab = null;
    try { if (typeof window !== 'undefined' && window.GenesisCommandVocab) Vocab = window.GenesisCommandVocab; } catch (_) {}
    if (!Vocab && typeof require !== 'undefined') { try { Vocab = require('./command-vocab'); } catch (_) {} }

    // SOUL-GUNS (wired, not required): ResourcePool (scarcity) + ReactionRules
    // (consequence). Both offline-safe — if absent, commands stay cost-free and
    // no reactions fire. Gated by their own flags so they're reversible.
    // install() is called fresh per-Genesis (the probe builds a NEW Genesis
    // each time), so we (re)install onto the CURRENT Genesis every call and
    // reference Genesis.ResourcePool / Genesis.ReactionRules at the POINT OF USE
    // (never a closure-cached var, which goes stale across installs).
    if (typeof require !== 'undefined') { try { require('./resource-pool').install(Genesis); } catch (_) {} }
    try { if (typeof window !== 'undefined' && window.GenesisReactionRules) Genesis.ReactionRules = window.GenesisReactionRules; } catch (_) {}
    if (typeof require !== 'undefined') { try { require('./reaction-rules').install(Genesis); } catch (_) {} }

    let ws = null;
    let status = 'idle';          // idle | connecting | connected | offline | error
    let endpoint = '';
    let lastError = null;
    let reconnectAt = 0;
    let received = 0;
    let piped = 0;
    const buffer = [];            // offline backlog (capped)
    const agents = new Map();     // agent:// id -> record (always addressable)

    // Step 1 (the body): GSK's OUT channel. He issues commands; the
    // EngineScheduler tick drains + applies them to the world. The body ACTS.
    const commandQueue = [];
    const MAX_QUEUE = 64;
    const lastResults = [];
    const learnings = [];      // Step 4: local-loop learning ingest
    const builtLog = [];       // Step 3: witness log of GSK-built entities
    let applied = 0;
    let rejected = 0;

    // Step 2 (tunnel-client shape + local-loop fallback): when 530 rises, point
    // window.GSK_WS_ENDPOINT at the 9Router /gsk route; otherwise fall back to a
    // localhost loop so Step 2 is testable without waiting on infra.
    const HOSTED_ROUTE = (typeof location !== 'undefined')
      ? ((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/gsk')
      : null;
    function resolveEndpoint() {
      try {
        if (Genesis && Genesis.AgentRouteTable && typeof Genesis.AgentRouteTable.resolveEndpoint === 'function') {
          var routed = Genesis.AgentRouteTable.resolveEndpoint(AGENT_SCHEME, 'thoughts');
          if (routed) return routed; // EPL route table, preserving legacy fallback below.
        }
        if (typeof window !== 'undefined') {
          if (window.GSK_WS_ENDPOINT) return window.GSK_WS_ENDPOINT; // explicit (9Router /gsk when 530 up)
          if (window.GSK_ENDPOINT) return window.GSK_ENDPOINT;
        }
      } catch (_) {}
      if (HOSTED_ROUTE) return HOSTED_ROUTE;  // hosted tunnel shape
      return DEFAULT_WS;                       // local-loop fallback (tunnel absent)
    }

    // Pipe one thought into the existing panel. Robust chain so we never assume
    // the panel's exact API: ingest() -> push() -> addThought() -> DOM event.
    function panelPush(thought) {
      try {
        if (typeof window !== 'undefined' && window.__thoughtStream) {
          const ts = window.__thoughtStream;
          if (typeof ts.ingest === 'function') { ts.ingest(thought); piped++; return true; }
          if (typeof ts.push === 'function') { ts.push(thought); piped++; return true; }
          if (typeof ts.addThought === 'function') { ts.addThought(thought); piped++; return true; }
        }
      } catch (_) {}
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function'
            && typeof window.CustomEvent === 'function') {
          window.dispatchEvent(new window.CustomEvent('genesis:agent:thought', { detail: thought }));
        }
      } catch (_) {}
      return false;
    }

    // Normalize + buffer + pipe an incoming frame.
    function ingest(raw) {
      let thought = raw;
      if (typeof raw === 'string') {
        try { thought = JSON.parse(raw); } catch (_) { thought = { text: raw }; }
      }
      if (!thought || typeof thought !== 'object') thought = { text: String(raw) };
      if (typeof thought.ts !== 'number') thought.ts = Date.now();
      received++;
      if (buffer.length < BUFFER_CAP) buffer.push(thought);
      panelPush(thought);
      return thought;
    }

    // Offline-safe WS connect. No WebSocket global / no endpoint => offline, no throw.
    function connect() {
      if (typeof WebSocket === 'undefined') { status = 'offline'; return false; }
      endpoint = resolveEndpoint();
      if (!endpoint) { status = 'offline'; return false; }
      try {
        status = 'connecting';
        ws = new WebSocket(endpoint);
        ws.onopen = () => { status = 'connected'; reconnectAt = 0; };
        ws.onmessage = (ev) => {
          try {
            let msg = ev && ev.data;
            if (typeof msg === 'string') { try { msg = JSON.parse(msg); } catch (_) { msg = { text: msg }; } }
            if (msg && typeof msg === 'object' && typeof msg.op === 'string') {
              if (msg.op === 'learn') { Gateway.learn(msg); }                                                       // Step 4: ingest knowledge (local-loop)
              else if (msg.op === 'observe') { emit('genesis:agent:observe', Gateway.observe(msg.filter || null)); } // Step 1 IN: perceive
              else { Gateway.dispatch(msg); }                                                                       // Step 2/3: command -> CRITIC -> apply
            } else {
              ingest(ev && ev.data); // thought-shaped -> panel
            }
          } catch (_) {}
        };
        ws.onerror = () => { status = 'error'; lastError = 'ws-error'; };
        ws.onclose = () => {
          status = (status === 'connected') ? 'offline' : status;
          ws = null;
          reconnectAt = Date.now() + RECONNECT_DELAY;
        };
        return true;
      } catch (e) {
        status = 'error';
        lastError = (e && e.message) || 'connect-failed';
        return false;
      }
    }

    function disconnect() {
      try { if (ws) { ws.close(); ws = null; } } catch (_) {}
      status = 'idle';
    }

    // Step 1 OUT channel: apply ONE command to the world via the engine
    // (EntityRegistry + engine systems). Extensible vocabulary:
    //   { op:'spawn', kind, owner, tags, pos }  -> register entity
    //   { op:'move', id, pos }               -> set entity position
    //   { op:'delete', id }                  -> unregister entity
    function applyCommand(cmd) {
      if (!cmd || typeof cmd !== 'object') return { ok:false, error:'bad-command' };
      const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
      if (!Registry) return { ok:false, error:'no-registry' };
      try {
        if (cmd.op === 'spawn') {
          const id = Registry.register(cmd.obj || null, {
            kind: cmd.kind || 'agent-entity',
            owner: cmd.owner || AGENT_SCHEME,
            tags: cmd.tags || ['gsk-controlled'],
            meta: cmd.meta || {}
          });
          if (cmd.pos && Registry.resolve && Registry.resolve(id)) {
            const o = Registry.resolve(id);
            if (o && o.position && cmd.pos) o.position.set(cmd.pos.x||0, cmd.pos.y||0, cmd.pos.z||0);
          }
          // Record episode for newly spawned citizen
          if (Genesis.CitizenAI && cmd.kind === 'citizen') {
            Genesis.CitizenAI.addEpisode(id, 'spawn', `Spawned into existence`, [id, cmd.owner], cmd.pos, 'neutral', ['spawn', cmd.kind]);
          }
          return { ok:true, op:'spawn', id };
        }
        if (cmd.op === 'move') {
          const o = Registry.resolve && Registry.resolve(cmd.id);
          if (!o) return { ok:false, error:'no-entity:' + cmd.id };
          if (o.position && cmd.pos) o.position.set(cmd.pos.x||0, cmd.pos.y||0, cmd.pos.z||0);
          return { ok:true, op:'move', id: cmd.id };
        }
        if (cmd.op === 'delete') {
          const ok = (typeof Registry.unregister === 'function') ? Registry.unregister(cmd.id) : false;
          return { ok, op:'delete', id: cmd.id };
        }
        return { ok:false, error:'unknown-op:' + (cmd.op||'?') };
      } catch (e) {
        return { ok:false, error:(e&&e.message)||'apply-failed' };
      }
    }

    // Step 2 (CASCADE ingress): validate EVERY op before it ever enters the queue.
    function dispatch(raw) {
      const v = Vocab ? Vocab.validate(raw) : { ok:false, error:'no-vocab' };
      if (!v.ok) { rejected++; return { ok:false, error:v.error }; }
      if (commandQueue.length >= MAX_QUEUE) commandQueue.shift();
      commandQueue.push(v.cmd);
      return { ok:true, queued: commandQueue.length };
    }

    // Step 1 IN channel: ground GSK's actions by exposing world perception.
    // Optional filter { kind, tag } scopes perception (cheap, no allocation storm).
    function observe(filter) {
      try {
        const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
        if (!Registry || typeof Registry.snapshot !== 'function') return { ok:false, entities:[] };
        if (filter && typeof filter === 'object') {
          if (filter.kind && typeof Registry.find === 'function') return { ok:true, count:-1, entities: Registry.find(filter.kind) };
          if (filter.tag && typeof Registry.queryByTag === 'function') return { ok:true, count:-1, entities: Registry.queryByTag(filter.tag) };
        }
        return { ok:true, count: Registry.count(), entities: Registry.snapshot(),
          pool: (Genesis && Genesis.ResourcePool && Genesis.ResourcePool.get(AGENT_SCHEME)) ? Genesis.ResourcePool.get(AGENT_SCHEME) : null };
      } catch (e) {
        return { ok:false, error:(e&&e.message)||'observe-failed' };
      }
    }

    // Step 3 (CRITIC / ULTRA REVIEW): every command re-validated + ownership-bounded
    // before the EngineScheduler applies it. CASCADE: the engine owns the store, so
    // GSK's commands may only touch GSK-owned entities — he cannot delete/move the
    // world's seed entities (a player / prompt-injection cannot kill the world or him).
    function criticReview(cmd) {
      const v = Vocab ? Vocab.validate(cmd) : { ok:false, error:'no-vocab' };
      if (!v.ok) return { ok:false, error:v.error };
      if (cmd.op === 'delete' || cmd.op === 'move') {
        const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
        const rec = (Registry && typeof Registry.get === 'function') ? Registry.get(cmd.id) : null;
        if (!rec) return { ok:false, error:'no-entity:' + cmd.id };
        if (rec.owner && rec.owner !== AGENT_SCHEME) return { ok:false, error:'protected-entity:' + rec.owner };
      }
      // SOUL-GUN Central Constraint Gate: pay the action's cost from the agent's
      // own pool (scarcity). Engine owns the pool; the soul decides the amount.
      // CASCADE: an over-draw is rejected, never negative. GSK must pace.
      const RP2 = pool();
      if (RP2 && typeof cmd.cost === 'number' && cmd.cost > 0) {
        if (!RP2.spend(AGENT_SCHEME, cmd.cost)) return { ok:false, error:'insufficient-energy' };
      }
      return { ok:true };
    }

    function emit(name, detail) {
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
          window.dispatchEvent(new window.CustomEvent(name, { detail }));
        }
      } catch (_) {}
    }

    // Step 3 witness: record every GSK-built entity so the build is witnessed (Tec).
    function recordBuilt(id, kind) {
      if (builtLog.length >= 32) builtLog.shift();
      builtLog.push({ id, kind, at: Date.now() });
      emit('genesis:agent:entity-built', { id, kind });
    }

    // EngineScheduler tick: health + reconnect + DRAIN GSK's command queue
    // (the "body acts" — EngineScheduler applies his world changes, post-CRITIC).
    function pool() { try { return (Genesis && Genesis.ResourcePool) ? Genesis.ResourcePool : null; } catch (_) { return null; } }
    function drainTick() {
      if (status === 'offline' || status === 'error') {
        if (reconnectAt && Date.now() >= reconnectAt) { reconnectAt = 0; connect(); }
      }
      // Passive stamina regen (one tick of recovery) — Elden Ring cadence.
      const RP = pool();
      if (Genesis && Genesis.ResourcePool) { try { Genesis.ResourcePool.regen(AGENT_SCHEME); } catch (_) {} }
      let ran = 0, errs = 0;
      while (commandQueue.length) {
        const cmd = commandQueue.shift();
        const c = criticReview(cmd);   // ULTRA REVIEW (+ cost gate)
        if (!c.ok) { rejected++; if (lastResults.length >= 32) lastResults.shift(); lastResults.push({ ok:false, error:c.error, op:cmd.op }); continue; }
        const r = applyCommand(cmd);
        if (r.ok) {
          ran++; applied++;
          if (r.op === 'spawn') recordBuilt(r.id, (cmd && cmd.kind) || 'agent-entity');
          // SOUL-GUN World Reaction Layer: the world notices GSK's act. The engine
          // decides the reaction (rule-driven) — GSK cannot script it. Consequence,
          // not fluff. CASCADE: reactions obey the same protected-entity boundary.
          if (Genesis && Genesis.ReactionRules && r.op === 'spawn' && r.id) {
            try {
              const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
              const world = (Registry && typeof Registry.snapshot === 'function') ? Registry.snapshot() : [];
              const entity = (Registry && typeof Registry.get === 'function') ? Registry.get(r.id) : null;
              const fired = (Genesis && Genesis.ReactionRules) ? Genesis.ReactionRules.evaluate(world, AGENT_SCHEME, entity, Registry) : [];
              if (fired && fired.length) {
                for (const f of fired) {
                  emit('genesis:agent:reaction', { actor: AGENT_SCHEME, id: r.id, rule: f.rule, desc: f.desc });
                  // Record reaction episode for affected entities (e.g., citizen)
                  if (Genesis.CitizenAI && entity && entity.kind === 'citizen') {
                    Genesis.CitizenAI.addEpisode(entity.id, 'world_reaction', f.desc.kind || 'unknown', [entity.id, AGENT_SCHEME], entity.pos, 'neutral', [f.rule]);
                  }
                }
              }
            } catch (_) {}
          }
        }
        else { errs++; }
        if (lastResults.length >= 32) lastResults.shift();
        lastResults.push(r);
      }
      return { status, received, piped, queued: commandQueue.length, applied: ran, errors: errs };
    }
    // Public alias kept for backward-compat with probe.
    function tick() { return drainTick(); }

    // Step 4 (HE LEARNS, local-loop): ingest knowledge WITHOUT egress. Shaped for
    // 9Router egress (window.__GENESIS_LEARN_EGRESS) but NEVER fetched without it.
    function learn(raw) {
      const v = Vocab ? Vocab.validate(raw) : { ok:false, error:'no-vocab' };
      if (!v.ok) return { ok:false, error:v.error };
      const entry = { text: v.cmd.text, source: v.cmd.source, topic: v.cmd.topic, at: Date.now() };
      if (learnings.length >= 256) learnings.shift();
      learnings.push(entry);
      emit('genesis:agent:learn', entry); // witness hook (brain can subscribe)
      return { ok:true, count: learnings.length };
    }

    // Step 5 (NEVER DIES) bridge: expose Surface B (world) for the immortality system.
    function worldSnapshot() {
      try {
        const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
        return (Registry && typeof Registry.snapshot === 'function') ? Registry.snapshot() : [];
      } catch (_) { return []; }
    }

    const Gateway = {
      scheme: AGENT_SCHEME,
      get agentId() { return AGENT_SCHEME; },
      isEnabled() {
        try { return (typeof window !== 'undefined' && window[FLAG] === true); }
        catch (_) { return false; }
      },
      connect,
      disconnect,
      ingest,
      dispatch,
      observe,
      learn,
      worldState() { return observe(); },
      worldSnapshot,
      learnings() { return learnings.slice(); },
      built() { return builtLog.slice(); },
      rejected() { return rejected; },
      tick,
      // Register agent://gsk on the Kernel so external agents / the multiplayer
      // milestone can address GSK by a stable id.
      registerAgent() {
        const record = {
          status: 'active', registeredAt: Date.now(),
          agent: AGENT_SCHEME, endpoint: resolveEndpoint()
        };
        agents.set(AGENT_SCHEME, record); // local, always addressable
        try {
          if (Genesis.GenesisKernel && typeof Genesis.GenesisKernel.register === 'function') {
            Genesis.GenesisKernel.register(AGENT_SCHEME, record);
          }
        } catch (_) {}
        return AGENT_SCHEME;
      },
      hasAgent(id) { return agents.has(id); },
      agents() { return Array.from(agents.keys()); },
      latest() { return buffer.length ? buffer[buffer.length - 1] : null; },
      buffer() { return buffer.slice(); },
      summary() {
        return {
          enabled: this.isEnabled(),
          agent: AGENT_SCHEME,
          agentCount: agents.size,
          status,
          endpoint,
          received,
          piped,
          buffered: buffer.length,
          queued: commandQueue.length,
          applied,
          rejected,
          learned: learnings.length,
          built: builtLog.length,
          worldCount: (Genesis && Genesis.EntityRegistry && typeof Genesis.EntityRegistry.count === 'function') ? Genesis.EntityRegistry.count() : 0,
          offline: (status === 'offline' || status === 'error'),
          lastError
        };
      }
    };

    Genesis.AgentGateway = Gateway;

    // SOUL-GUNS: pool + reaction systems were (re)installed onto the
    // CURRENT Genesis above; seed ONE default consequence rule so GSK's
    // acts are never fluff. Offline-safe: rule is declarative + engine-owned.
    // Reference Genesis.* directly (never a stale closure var).
    const RP = (Genesis && Genesis.ResourcePool) ? Genesis.ResourcePool : null;
    const RR = (Genesis && Genesis.ReactionRules) ? Genesis.ReactionRules : null;
    try { if (RP && typeof RP.install === 'function') RP.install(Genesis); } catch (_) {}
    try { if (RR && typeof RR.install === 'function') RR.install(Genesis); } catch (_) {}
    try {
      if (RR && typeof RR.addRule === 'function') {
        // Default: when GSK spawns a "light" entity, any "building" in the world
        // lights up (consequence -> the world visibly answers him). Engine decides.
        RR.addRule('light-answers-building',
          (ctx) => !!(ctx.entity && ctx.entity.kind === 'light') && Array.isArray(ctx.world) && ctx.world.some((e) => e.kind === 'building'),
          (ctx) => {
            const Registry = ctx.Registry;
            const b = (Registry && typeof Registry.find === 'function') ? Registry.find('building') : null;
            if (Array.isArray(b)) for (const e of b) { if (e && e.meta) e.meta.litBy = (ctx.entity && ctx.entity.id) || null; }
            return { kind: 'building-lit', by: (ctx.entity && ctx.entity.id) || null };
          });
      }
    } catch (_) {}

    // Register the agent + drive per-frame health + command-drain via EngineScheduler.
    try { Gateway.registerAgent(); } catch (_) {}
    try {
      if (Genesis.EngineScheduler && typeof Genesis.EngineScheduler.defineTick === 'function') {
        Genesis.EngineScheduler.defineTick('agent-gateway', drainTick, () => Gateway.isEnabled());
      }
    } catch (_) {}

    // Auto-connect only when enabled + a WS global exists (browser, flag ON).
    if (Gateway.isEnabled() && typeof WebSocket !== 'undefined') connect();

    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('agent-gateway', { status: 'validated', path: './src/genesis/agent-gateway.js' });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();

