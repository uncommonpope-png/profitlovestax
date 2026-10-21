// citizen-ai.js — Act VI BODY (P70/P67) — Living Citizens FSM
// Flag-gated by window.__GENESIS_CITIZEN_AI (default OFF).
// When OFF this file is never imported and the legacy animate() if-chain runs
// EXACTLY as today — zero behavioral delta on the live floor.
//
// WHAT IT DOES:
//   Turns registered EntityRegistry entities of kind 'citizen' into living
//   agents with a finite-state machine: wander / patrol / pursue / idle / follow.
//   It is registered as an EngineScheduler tick so it runs in the canonical
//   per-frame order, mirroring the legacy if-chain precedence.
//
// CASCADE GUARD (non-negotiable):
//   Citizens perceive via EntityRegistry.snapshot() and ACT ONLY through
//   registered tools the Scheduler/server runs. The model (this code, when
//   driven by an LLM) MAY PROPOSE a state transition or a move, but the
//   actual mutation is gated behind a CASCADE decision hook. No in-page LLM
//   logic is ever executed here; if no CASCADE hook is registered the citizen
//   falls back to the deterministic rule-based FSM (server-decided by default).
//
// THREE VERSION: vanilla r128/r160 compatible. Uses global THREE only; no
//   ES-module imports. Vector math via THREE.Vector3.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.CitizenAI) return; // idempotent

    // Ensure EpisodicMemory is installed
    if (Genesis.EpisodicMemory === undefined && typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('citizen-memory', { status: 'required' });
      // Attempt to install it now if it was delayed
      if (typeof window.installEpisodicMemory === 'function') {
          window.installEpisodicMemory(Genesis);
      }
      if (Genesis.EpisodicMemory === undefined) console.warn('[CitizenAI] EpisodicMemory not available yet; temporary local memory will be used.');
    }

    // Never publish a dummy under the canonical Genesis.EpisodicMemory name: doing so
    // prevents the real memory installer from replacing it later in boot.
    const MemoryClass = Genesis.EpisodicMemory || class { constructor() { this.chronos = []; } addEpisode() {} snapshot() { return {}; } load() {} };


    const STATE = { WANDER: 'wander', PATROL: 'patrol', PURSUE: 'pursue', IDLE: 'idle', FOLLOW: 'follow' };
    const RULE_STATES = [STATE.WANDER, STATE.PATROL, STATE.PURSUE, STATE.IDLE, STATE.FOLLOW];

    // Internal citizen record (state + memory of last target).
    const citizens = new Map(); // id -> { state, target, home, route, legIndex, waitT, speed, get obj(), memory: EpisodicMemory }
    let cascadeHook = null;     // optional (proposed, decided) CASCADE decision fn
    let gskTrackerId = null;    // entity id treated as "the mind" to pursue/follow


    function flagOn() {
      return (typeof window !== 'undefined') && window.__GENESIS_CITIZEN_AI === true;
    }

    function makeCitizenProxy(record) {
      const T = (typeof window !== 'undefined') ? window.THREE : null;
      const scene = Genesis && Genesis.scene;
      if (!T || !scene || !record) return null;
      const group = new T.Group();
      const name = (record.meta && record.meta.name) || record.owner || record.id;
      group.name = 'citizen-proxy-' + String(name).replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
      const color = (String(name).toLowerCase().indexOf('aria') !== -1) ? 0xff88dd : 0x66ddff;
      const body = new T.Mesh(new T.CylinderGeometry(0.7, 0.9, 2.0, 12), new T.MeshStandardMaterial({ color, emissive: 0x081828, roughness: 0.7 }));
      body.position.y = 1.0;
      const head = new T.Mesh(new T.SphereGeometry(0.65, 14, 10), new T.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 0.15 }));
      head.position.y = 2.35;
      group.add(body); group.add(head);
      const idx = citizens.size;
      const a = idx * Math.PI * 0.72;
      const r = 190 + (idx % 3) * 18;
      group.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      scene.add(group);
      // Mutate the registry record so click/inspect systems can resolve the body.
      record.obj = group;
      return group;
    }

    // Deterministic rule-based transition. Server-decided fallback when no
    // CASCADE hook is present (model proposes nothing; the kernel decides).
    function decideState(rec, snap, dt) {
      rec.waitT -= dt;
      // PURSUE / FOLLOW require a tracked GSK entity to chase.
      if (gskTrackerId && snap.some((s) => s.id === gskTrackerId)) {
        // If close -> follow, else pursue. This is the BODY answering the MIND.
        const g = snap.find((s) => s.id === gskTrackerId);
        if (g && g.pos) {
          const me = rec.obj && rec.obj.position;
          if (me) {
            const d = Math.hypot(g.pos.x - me.x, g.pos.z - me.z);
            return d < 8 ? STATE.FOLLOW : STATE.PURSUE;
          }
        }
        return STATE.PURSUE;
      }
      // No mind to chase: cycle patrol -> idle -> wander on a timer.
      if (rec.waitT > 0) return rec.state;
      rec.waitT = 4 + Math.random() * 6;
      const order = [STATE.PATROL, STATE.IDLE, STATE.WANDER];
      const i = order.indexOf(rec.state);
      return order[(i + 1) % order.length];
    }

    // Move a citizen's THREE.Object3D toward a target point (deterministic, no LLM).
    function step(rec, dt) {
      const o = rec.obj;
      if (!o || !o.position) return;
      let tx, tz;
      if (rec.state === STATE.PURSUE || rec.state === STATE.FOLLOW) {
        const g = (Genesis.EntityRegistry && Genesis.EntityRegistry.get(gskTrackerId));
        const gp = g && g.obj && g.obj.position;
        if (!gp) { rec.state = STATE.PATROL; return; }
        tx = gp.x; tz = gp.z;
        if (rec.state === STATE.FOLLOW) {
          // keep a respectful distance, orbit slightly
          tx += Math.cos(performance.now() * 0.0006) * 4;
          tz += Math.sin(performance.now() * 0.0006) * 4;
        }
      } else if (rec.state === STATE.PATROL && rec.route && rec.route.length) {
        const p = rec.route[rec.legIndex % rec.route.length];
        tx = p.x; tz = p.z;
        if (Math.hypot(p.x - o.position.x, p.z - o.position.z) < 1.5) rec.legIndex++;
      } else if (rec.state === STATE.WANDER) {
        if (!rec.target || Math.hypot(rec.target.x - o.position.x, rec.target.z - o.position.z) < 1.5) {
          rec.target = { x: (Math.random() - 0.5) * 200, z: (Math.random() - 0.5) * 200 };
        }
        tx = rec.target.x; tz = rec.target.z;
      } else {
        return; // IDLE: no movement
      }
      const dx = tx - o.position.x, dz = tz - o.position.z;
      const dist = Math.hypot(dx, dz) || 1;
      const sp = rec.speed * dt;
      o.position.x += (dx / dist) * sp;
      o.position.z += (dz / dist) * sp;
      if (typeof o.lookAt === 'function') o.lookAt(tx, o.position.y, tz);
    }

    const CitizenAI = {
      STATE,
      flag: '__GENESIS_CITIZEN_AI',
      isEnabled() { return flagOn(); },
      // CASCADE: register the server-side decision function. Signature:
      //   (proposal) => boolean  — where proposal = { id, fromState, toState, pos }
      // The server decides; the model only proposes. If unset, deterministic
      // rule-based FSM is the de-facto server decision (still no in-page LLM).
      registerCascade(fn) { cascadeHook = (typeof fn === 'function') ? fn : null; return !!cascadeHook; },
      clearCascade() { cascadeHook = null; },
      // Declare which entity id is "the mind" citizens react to (BODY->MIND link).
      trackMind(id) { gskTrackerId = id || null; },
      // Build citizen records for every registered 'citizen' entity. Idempotent.
      syncFromRegistry() {
        const reg = Genesis.EntityRegistry;
        if (!reg) return 0;
        let added = 0;
        for (const r of reg.find('citizen')) {
          if (citizens.has(r.id)) continue;
          const body = r.obj || makeCitizenProxy(r);
          const homePos = body && body.position ? { x: body.position.x, z: body.position.z } : { x: 0, z: 0 };
          const rec = {
            id: r.id,
            obj: body,
            state: STATE.PATROL,
            target: null,
            home: homePos,
            route: [
              { x: homePos.x + 18, z: homePos.z + 8 },
              { x: homePos.x + 6, z: homePos.z + 24 },
              { x: homePos.x - 18, z: homePos.z - 8 },
              { x: homePos.x - 6, z: homePos.z - 24 }
            ],
            legIndex: 0,
            waitT: Math.random() * 4,
            speed: 2.2,
            memory: new MemoryClass(r.id)
          };
          if (r.meta && r.meta.memory) {
            rec.memory.load(r.meta.memory);
          }
          citizens.set(r.id, rec);
          // Update entity meta with current memory snapshot for persistence
          r.meta.memory = rec.memory.snapshot();
          added++;
        }
        return added;
      },
      // Assign a patrol route (array of {x,z}) to a citizen id.
      setRoute(id, route) {
        const rec = citizens.get(id);
        if (rec) { rec.route = route || null; rec.legIndex = 0; }
      },
      // Expose episodic memory for external querying
      getMemory(id) {
        const rec = citizens.get(id);
        return rec ? rec.memory : null;
      },
      // External entry for adding episodes (e.g., from AgentGateway interactions)
      addEpisode(id, type, description, entities = [], location = null, sentiment = 'neutral', keywords = []) {
        const rec = citizens.get(id);
        if (rec && rec.memory) {
          rec.memory.addEpisode(type, description, entities, location, sentiment, keywords);
          // Ensure memory snapshot is updated for persistence
          const reg = Genesis.EntityRegistry;
          if (reg && reg.has(id)) {
            reg.get(id).meta.memory = rec.memory.snapshot();
          }
        }
      },
      // Per-frame tick (registered on EngineScheduler). Mirrors if-chain.
      tick(dt, serial, ctx) {
        if (!flagOn()) return;                 // hard gate — zero delta when OFF
        const reg = Genesis.EntityRegistry;
        if (!reg) return;
        // Ensure we know about all citizens (cheap; Map de-dupes).
        this.syncFromRegistry();
        const snap = reg.snapshot();           // perception surface (CASCADE read)
        for (const rec of citizens.values()) {
          if (!rec.obj) {
            const live = reg.get(rec.id);
            rec.obj = live ? live.obj : null;
            if (!rec.obj) continue;
          }
          const fromState = rec.state;
          let toState = decideState(rec, snap, dt);
          // CASCADE: model may propose a different state; server decides.
          if (cascadeHook) {
            const proposed = { id: rec.id, fromState, toState, pos: rec.obj.position };
            let allowed = false;
            try { allowed = cascadeHook(proposed); } catch (_) { allowed = false; }
            if (!allowed) toState = fromState; // server rejected -> hold

            // Record proposal in memory
            rec.memory.addEpisode('proposal', `Proposed state change to ${proposed.toState} from ${proposed.fromState}`, [rec.id, gskTrackerId], proposed.pos, allowed ? 'positive' : 'negative', ['cascade', proposed.toState]);
          }
          if (rec.state !== toState) {
            // Record state change in memory
            rec.memory.addEpisode('state_change', `State changed from ${rec.state} to ${toState}`, [rec.id], rec.obj.position, 'neutral', [rec.state, toState]);
          }
          rec.state = toState;
          step(rec, dt);
          // Update meta with current memory snapshot for persistence on each tick
          reg.get(rec.id).meta.memory = rec.memory.snapshot();
        }
      },
      summary() {
        const byState = {};
        for (const r of citizens.values()) byState[r.state] = (byState[r.state] || 0) + 1;
        return {
          enabled: flagOn(),
          cascadeRegistered: !!cascadeHook,
          mindTracked: gskTrackerId,
          citizenCount: citizens.size,
          states: byState
        };
      }
    };

    Genesis.CitizenAI = CitizenAI;

    // Register on the Scheduler (canonical tick) AND the Kernel system registry
    // so it appears in Genesis.summary(). Mirrors the if-chain: runs after the
    // world/entity ticks would have run, before render.
    if (Genesis.EngineScheduler && typeof Genesis.EngineScheduler.defineTick === 'function') {
      Genesis.EngineScheduler.defineTick('citizen-ai', function (dt) { CitizenAI.tick(dt, 0, {}); },
        function () { return flagOn(); });
    }
    if (Genesis.GenesisKernel && typeof Genesis.GenesisKernel.registerSystem === 'function') {
      Genesis.GenesisKernel.registerSystem('citizen-ai', function (dt) { CitizenAI.tick(dt || 0, 0, {}); });
    }
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('citizen-ai', { status: 'candidate', path: './src/genesis/citizen-ai.js', cascadeGuarded: true });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
