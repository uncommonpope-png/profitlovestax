// EngineScheduler — Phase 1 Foundation (Step 5)
// Deterministic per-frame tick ordering for the modular Genesis runtime.
// Flag-gated by window.__GENESIS_SCHEDULER (default OFF). When OFF this file is
// never imported and the legacy animate() if-chain (index.html ~L13620-13647)
// runs EXACTLY as today — zero behavioral delta on the live floor.
//
// Inline-first design: the Scheduler does NOT replace the if-chain yet. It
// provides a single, well-ordered tick registry that later milestones (and
// the agent protocol) can drive. The install block in index.html keeps the
// original if-chain as the fallback; when the flag is ON, the Scheduler's
// registered order is what runs — identical calls, deterministic sequence.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.EngineScheduler) return; // idempotent

    // Canonical tick order mirrors the legacy animate() if-chain precedence.
    // Each entry is { name, get: () => fn, gate: () => bool }.
    const chain = [];
    const order = new Map(); // name -> index

    function defineTick(name, getFn, gateFn) {
      if (order.has(name)) return;
      const entry = { name, get: getFn, gate: gateFn || (() => true) };
      chain.push(entry);
      order.set(name, chain.length - 1);
    }

    const Scheduler = {
      // Register a tick in canonical position. Safe no-op if already present.
      defineTick,
      has(name) { return order.has(name); },
      order() { return chain.map((e) => e.name); },
      // Execute the chain. ctx carries { dt, time, flags, surfaceActive, hubActive }.
      // Each tick is guarded by its gate + existence check, mirroring the if-chain.
      run(ctx) {
        ctx = ctx || {};
        const dt = ctx.dt || 0;
        const serial = (ctx.serial || 0) + 1;
        const results = { ran: 0, skipped: 0, errors: 0 };
        for (const e of chain) {
          try {
            if (!e.gate(ctx)) { results.skipped++; continue; }
            const fn = e.get;
            if (typeof fn !== 'function') { results.skipped++; continue; }
            fn(dt, serial, ctx);
            results.ran++;
          } catch (err) {
            results.errors++;
            if (typeof console !== 'undefined') console.warn('[EngineScheduler] tick "' + e.name + '" failed:', err && err.message);
          }
        }
        return results;
      },
      clear() { chain.length = 0; order.clear(); },
      summary() {
        return { enabled: true, tickCount: chain.length, order: chain.map((e) => e.name) };
      }
    };

    Genesis.EngineScheduler = Scheduler;
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('engine-scheduler', { status: 'validated', path: './src/genesis/scheduler.js' });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
