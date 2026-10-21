// GenesisKernel — Phase 1 Foundation (Step 3)
// Boot / register / teardown orchestration for the modular Genesis runtime.
// Flag-gated by window.__GENESIS_KERNEL (default OFF). When OFF, this file is
// never imported and the monolith's inline boot path runs unchanged.
// When ON, it provides a stable registration surface so external agents and
// later milestones (scheduler, entity registry, agent protocol) can attach
// without mutating the legacy boot sequence.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.GenesisKernel) return; // idempotent

    const modules = new Map();   // name -> { record, installed }
    const systems = new Map();   // name -> tick fn (registered by scheduler/agents)
    let booted = false;

    const Kernel = {
      // Register a subsystem. Does NOT execute anything; pure bookkeeping so
      // the legacy world is untouched until a later milestone activates it.
      register(name, record) {
        if (!name) return;
        modules.set(name, Object.assign({ status: 'registered', registeredAt: Date.now() }, record || {}));
      },
      has(name) { return modules.has(name); },
      get(name) { return modules.get(name); },
      list() { return Array.from(modules.keys()); },
      // External agents / later milestones register a per-frame tick here.
      registerSystem(name, tickFn) {
        if (!name || typeof tickFn !== 'function') return false;
        systems.set(name, tickFn);
        return true;
      },
      unregisterSystem(name) { return systems.delete(name); },
      systems() { return Array.from(systems.keys()); },
      boot() {
        if (booted) return this.summary();
        booted = true;
        Genesis.boot = Genesis.boot || {};
        Genesis.boot.kernelAt = Date.now();
        return this.summary();
      },
      isBooted() { return booted; },
      // Deterministic teardown order: systems first, then modules.
      teardown() {
        for (const name of systems.keys()) { try { systems.delete(name); } catch (_) {} }
        modules.clear();
        booted = false;
        return { tornDown: true };
      },
      summary() {
        return {
          enabled: true,
          booted,
          moduleCount: modules.size,
          systemCount: systems.size,
          modules: Array.from(modules.entries()).map(([n, r]) => ({ name: n, status: r.status })),
          systems: Array.from(systems.keys())
        };
      }
    };

    Genesis.GenesisKernel = Kernel;
    // Surface on the canonical module registry so it shows in Genesis.summary().
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('genesis-kernel', { status: 'validated', path: './src/genesis/kernel.js' });
    }
  }

  // Support both ES-module and inline-script consumption.
  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
