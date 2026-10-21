// agent-citizen.js — C3: the AGENT-CITIZEN FACTORY (GSK's world, populated).
// Dark City model: every agent (Allie, ARIA, the subagent fleet) is a NATIVE
// INHABITANT of the engine — not an external connector, not routed through GSK.
// Each citizen is instantiated INSIDE the engine at boot (alive in the construct,
// like Matrix Programs / No Man's Sky Sentinels). They have their OWN brain
// (identity + learn() + observe() + dispatch()) and their OWN entity ownership,
// bounded by CASCADE so no citizen (and not GSK) can delete another's soul.
//
// The factory (createCitizen) is config-driven: pass an agent descriptor and get
// back a spine module wired to agent://<id> with command-OUT + world-IN + learn,
// registration on GenesisKernel, and a per-frame tick driven by EngineScheduler.
// GSK = the controller (agent://gsk, already built in agent-gateway.js) — he
// perceives the whole world but cannot unmake a citizen (CASCADE protects them).
//
// Flag-gated by window.__GENESIS_AGENT_CITIZENS (default OFF). Offline-safe.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.AgentCitizen) return; // idempotent

    const FLAG = '__GENESIS_AGENT_CITIZENS';
    const GSK_SCHEME = 'agent://gsk';
    const BUFFER_CAP = 256;
    const MAX_QUEUE = 64;
    const RECONNECT_DELAY = 2000;

    let Vocab = null;
    try { if (typeof window !== 'undefined' && (window.GenesisCommandVocab || window.__agentVocab)) Vocab = window.GenesisCommandVocab || window.__agentVocab; } catch (_) {}
    if (!Vocab && typeof require !== 'undefined') { try { Vocab = require('./command-vocab'); } catch (_) {} }

    const citizens = new Map(); // agent://id -> citizen record

    function isEnabled() {
      try { return (typeof window !== 'undefined' && window[FLAG] === true); } catch (_) { return false; }
    }
    function resolveEndpoint(id) {
      try {
        if (Genesis && Genesis.AgentRouteTable && typeof Genesis.AgentRouteTable.resolveEndpoint === 'function') {
          var routed = Genesis.AgentRouteTable.resolveEndpoint(id, 'thoughts') || Genesis.AgentRouteTable.resolveEndpoint(GSK_SCHEME, 'thoughts');
          if (routed) return routed; // EPL route table first; legacy fallback below.
        }
        if (typeof window !== 'undefined') {
          if (window.GSK_WS_ENDPOINT) return window.GSK_WS_ENDPOINT; // 9Router /gsk when 530 up
          if (window.GSK_ENDPOINT) return window.GSK_ENDPOINT;
        }
      } catch (_) {}
      return 'ws://localhost:3002';
    }

    // ---- The factory: one citizen spine per agent descriptor ---------------
    // descriptor = {
    //   id: 'allie',                       // -> scheme agent://allie
    //   name: 'Allie',                     // display
    //   role: 'social-agent',              // archetype
    //   endpoint: null,                    // WS to the agent's own thought-stream (optional)
    //   brain: { core: '...', learns: true, observes: true },
    //   spawn: { kind: 'citizen', tags: ['allie'], pos:{x,y,z} }  // initial entity
    // }
    function createCitizen(descriptor) {
      if (!descriptor || typeof descriptor.id !== 'string') return { ok:false, error:'bad-descriptor' };
      const SCHEME = 'agent://' + descriptor.id;
      if (citizens.has(SCHEME)) return { ok:false, error:'already-exists:' + SCHEME };

      const NAME = descriptor.name || descriptor.id;
      const ROLE = descriptor.role || 'citizen';
      const BRAIN = descriptor.brain || {};
      const ENDPOINT = descriptor.endpoint || resolveEndpoint(SCHEME);
      const SPAWN = descriptor.spawn || null;
      const AFFORDS = descriptor.affords || ['talk']; // interaction affordances (Smart-Object style)

      let ws = null;
      let status = 'idle';
      let endpoint = ENDPOINT;
      let lastError = null;
      let reconnectAt = 0;
      let received = 0, piped = 0, applied = 0, rejected = 0;
      const buffer = [];
      const commandQueue = [];
      const learnings = [];
      const observeLog = [];
      const dialogueLog = [];        // C4.1: per-citizen conversation memory (relationship continuity)
      let affinity = 0;              // C4.1: relationship score with the player (rises on talk)
      let entityId = null;

      function panelPush(thought) {
        try {
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function'
              && typeof window.CustomEvent === 'function') {
            window.dispatchEvent(new window.CustomEvent('genesis:citizen:thought', { detail: Object.assign({ citizen: SCHEME }, thought) }));
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
        endpoint = resolveEndpoint(SCHEME);
        if (!endpoint) { status = 'offline'; return false; }
        try {
          status = 'connecting';
          ws = new WebSocket(endpoint);
          ws.onopen = () => { status = 'connected'; reconnectAt = 0; };
          ws.onmessage = (ev) => { try {
            const d = (typeof ev.data === 'string') ? JSON.parse(ev.data) : ev.data;
            if (d && d.op === 'learn') learn(d);
            else if (d && d.op === 'observe') return; // IN handled by observe()
            else if (d && d.op) dispatch(d);          // command OUT
            else ingest(d);
          } catch (_) {} };
          ws.onerror = () => { status = 'error'; lastError = 'ws-error'; };
          ws.onclose = () => { status = (status === 'connected') ? 'offline' : status; ws = null; reconnectAt = Date.now() + RECONNECT_DELAY; };
          return true;
        } catch (e) { status = 'error'; lastError = (e && e.message) || 'connect-failed'; return false; }
      }
      function disconnect() { try { if (ws) { ws.close(); ws = null; } } catch (_) {} status = 'idle'; }

      // CRITIC gate: citizen may only touch ITS OWN entities. CASCADE: a citizen
      // (and GSK) cannot delete/move another citizen's or the world's seed entities.
      function applyCommand(cmd) {
        if (!cmd || typeof cmd !== 'object') return { ok:false, error:'bad-command' };
        const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
        if (!Registry) return { ok:false, error:'no-registry' };
        try {
          if (cmd.op === 'spawn') {
            const id = Registry.register(cmd.obj || null, {
              kind: cmd.kind || 'citizen',
              owner: SCHEME,
              tags: cmd.tags || [SCHEME],
              meta: Object.assign({ citizen: SCHEME }, cmd.meta || {})
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
            if (owner && owner !== SCHEME) return { ok:false, error:'cascade-denied:not-' + SCHEME };
            if (!o) return { ok:false, error:'no-world-object:' + cmd.id };
            if (o.position && cmd.pos) o.position.set(cmd.pos.x||0, cmd.pos.y||0, cmd.pos.z||0);
            return { ok:true, op:'move', id: cmd.id };
          }
          if (cmd.op === 'delete') {
            const rec = Registry.get ? Registry.get(cmd.id) : null;
            const o = Registry.resolve && Registry.resolve(cmd.id);
            if (!rec && !o) return { ok:false, error:'no-entity:' + cmd.id };
            const owner = rec ? rec.owner : o.owner;
            if (owner && owner !== SCHEME) return { ok:false, error:'cascade-denied:not-' + SCHEME };
            const ok = (typeof Registry.unregister === 'function') ? Registry.unregister(cmd.id) : false;
            return { ok, op:'delete', id: cmd.id };
          }
          return { ok:false, error:'unknown-op:' + (cmd.op||'?') };
        } catch (e) { return { ok:false, error:(e&&e.message)||'apply-failed' }; }
      }

      function dispatch(raw) {
        const v = Vocab ? Vocab.validate(raw) : { ok:false, error:'no-vocab' };
        if (!v.ok) { rejected++; return { ok:false, error:v.error }; }
        if (commandQueue.length >= MAX_QUEUE) commandQueue.shift();
        commandQueue.push(v.cmd);
        return { ok:true, queued: commandQueue.length };
      }

      // IN channel: citizen perceives the world so its actions are grounded.
      function observe(filter) {
        try {
          const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
          if (!Registry || typeof Registry.snapshot !== 'function') return { ok:false, entities:[] };
          let entities;
          if (filter && typeof filter === 'object') {
            if (filter.kind && typeof Registry.find === 'function') entities = Registry.find(filter.kind);
            else if (filter.tag && typeof Registry.queryByTag === 'function') entities = Registry.queryByTag(filter.tag);
            else entities = Registry.snapshot();
          } else entities = Registry.snapshot();
          const rec = { ok:true, citizen: SCHEME, entities };
          if (observeLog.length < BUFFER_CAP) observeLog.push(rec);
          return rec;
        } catch (_) { return { ok:false, entities:[] }; }
      }

      // HE LEARNS / SHE LEARNS: each citizen ingests knowledge (local-loop, no egress
      // unless window.__GENESIS_LEARN_EGRESS). Shaped for 9Router egress like GSK.
      function learn(raw) {
        if (!BRAIN.learns) return { ok:false, error:'learning-disabled' };
        const v = Vocab ? Vocab.validate(raw) : { ok:false, error:'no-vocab' };
        if (!v.ok) return { ok:false, error:v.error };
        const entry = { citizen: SCHEME, text: v.cmd.text, source: v.cmd.source, topic: v.cmd.topic, at: Date.now() };
        if (learnings.length >= 256) learnings.shift();
        learnings.push(entry);
        try {
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function'
              && typeof window.CustomEvent === 'function') {
            window.dispatchEvent(new window.CustomEvent('genesis:citizen:learn', { detail: entry }));
          }
        } catch (_) {}
        return { ok:true, count: learnings.length };
      }

      function tick() {
        while (commandQueue.length) {
          const cmd = commandQueue.shift();
          const r = applyCommand(cmd);
          if (r.ok) applied++; else rejected++;
        }
        if (status === 'offline' || status === 'error') {
          if (reconnectAt && Date.now() >= reconnectAt) { reconnectAt = 0; connect(); }
        }
        return { citizen: SCHEME, status, received, piped, applied, rejected, learned: learnings.length };
      }

      // Spawn the citizen's own body into the world on boot (alive in the engine).
      function manifest() {
        const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
        if (!Registry || !SPAWN) return null;
        const id = Registry.register(null, {
          kind: SPAWN.kind || 'citizen',
          owner: SCHEME,
          tags: SPAWN.tags || [SCHEME],
          meta: Object.assign({ citizen: SCHEME, name: NAME, role: ROLE }, SPAWN.meta || {})
        });
        if (SPAWN.pos && Registry.resolve && Registry.resolve(id)) {
          const o = Registry.resolve(id);
          if (o && o.position && SPAWN.pos) o.position.set(SPAWN.pos.x||0, SPAWN.pos.y||0, SPAWN.pos.z||0);
        }
        entityId = id;
        return id;
      }

      // C4.1: relationship + dialogue memory. talk() records the exchange and
      // raises affinity so returning later shows continuity (Smart-Object affordance).
      function talk(prompt, reply) {
        const entry = { at: Date.now(), prompt: (prompt || '').slice(0, 200), reply: (reply || '').slice(0, 200) };
        if (dialogueLog.length >= 64) dialogueLog.shift();
        dialogueLog.push(entry);
        affinity = Math.min(100, affinity + 1); // relationship grows with each contact
        try {
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function'
              && typeof window.CustomEvent === 'function') {
            window.dispatchEvent(new window.CustomEvent('genesis:citizen:dialogue', { detail: Object.assign({ citizen: SCHEME, affinity }, entry) }));
          }
        } catch (_) {}
        return entry;
      }

      // C4.1: Step 5 persistence surface — citizen's relationship self (Surface A slice).
      function serialize() {
        return { scheme: SCHEME, name: NAME, role: ROLE, affords: AFFORDS.slice(), affinity, dialogue: dialogueLog.slice(), learned: learnings.length };
      }

      // C4.1: rehydrate from a save (Surface A). Internal use by immortality restore.
      function _restore(snap) {
        if (!snap || typeof snap !== 'object') return;
        if (typeof snap.affinity === 'number') affinity = Math.max(0, Math.min(100, snap.affinity));
        if (Array.isArray(snap.dialogue)) { dialogueLog.length = 0; for (const d of snap.dialogue.slice(-64)) dialogueLog.push(d); }
        if (Array.isArray(snap.affords) && snap.affords.length) { AFFORDS.length = 0; snap.affords.forEach((a) => AFFORDS.push(a)); }
      }

      const Citizen = {
        scheme: SCHEME,
        get agentId() { return SCHEME; },
        name: NAME,
        role: ROLE,
        brain: BRAIN,
        affords: AFFORDS,
        isEnabled,
        connect, disconnect, ingest, dispatch, observe, learn, applyCommand, tick, manifest, talk, serialize, _restore,
        owns(id) {
          try { const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
            const o = Registry && Registry.resolve && Registry.resolve(id);
            return !!(o && o.owner === SCHEME);
          } catch (_) { return false; }
        },
        affinity() { return affinity; },
        dialogue() { return dialogueLog.slice(); },
        learnings() { return learnings.slice(); },
        summary() {
          return {
            enabled: isEnabled(), citizen: SCHEME, name: NAME, role: ROLE, status, endpoint,
            received, piped, applied, rejected, learned: learnings.length, entityId,
            affords: AFFORDS, affinity, dialogues: dialogueLog.length,
            worldCount: (Genesis && Genesis.EntityRegistry && typeof Genesis.EntityRegistry.count === 'function') ? Genesis.EntityRegistry.count() : 0,
            offline: (status === 'offline' || status === 'error'), lastError
          };
        }
      };

      citizens.set(SCHEME, Citizen);

      // Register on the Kernel as an addressable inhabitant of the world.
      try {
        if (Genesis.GenesisKernel && typeof Genesis.GenesisKernel.register === 'function') {
          Genesis.GenesisKernel.register(SCHEME, { status:'active', name: NAME, role: ROLE, registeredAt: Date.now(), endpoint });
        }
      } catch (_) {}

      // Spawn the body into the world now (native inhabitant, alive at boot).
      try { const id = manifest(); if (id && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function'
          && typeof window.CustomEvent === 'function') {
        window.dispatchEvent(new window.CustomEvent('genesis:citizen:born', { detail: { citizen: SCHEME, id, name: NAME, role: ROLE } }));
      } } catch (_) {}

      // Drive per-frame tick via EngineScheduler.
      try {
        if (Genesis.EngineScheduler && typeof Genesis.EngineScheduler.defineTick === 'function') {
          Genesis.EngineScheduler.defineTick('citizen:' + SCHEME, tick, () => isEnabled());
        }
      } catch (_) {}

      if (isEnabled() && typeof WebSocket !== 'undefined') connect();
      if (typeof Genesis.registerModule === 'function') {
        Genesis.registerModule('citizen:' + SCHEME, { status:'validated', path:'./src/genesis/agent-citizen.js' });
      }
      return { ok:true, citizen: Citizen };
    }

    const AgentCitizen = {
      scheme: 'agent-citizen-factory',
      isEnabled,
      createCitizen,
      hasCitizen(id) { return citizens.has('agent://' + id) || citizens.has(id); },
      citizen(id) { return citizens.get('agent://' + id) || citizens.get(id) || null; },
      citizens() { return Array.from(citizens.keys()); },
      count() { return citizens.size; },
      list() { return Array.from(citizens.values()).map((c) => c.summary()); },
      // GSK is the controller: list all inhabitants (citizens + GSK + Scribe).
      worldRoster() {
        const roster = [];
        if (Genesis.GenesisKernel && typeof Genesis.GenesisKernel.all === 'function') {
          const all = Genesis.GenesisKernel.all();
          if (Array.isArray(all)) all.forEach((r) => roster.push(r));
        }
        return roster;
      }
    };

    Genesis.AgentCitizen = AgentCitizen;

    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('agent-citizen', { status:'validated', path:'./src/genesis/agent-citizen.js' });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
