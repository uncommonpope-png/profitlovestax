'use strict';
const os = require('os');

class LazyBoot {
  constructor(memThresholds) {
    this._core = {};
    this._modules = {};
    this._factories = {};
    this._loading = {};
    this._tier = this._detectTier(memThresholds);
    this._loadHooks = {};
  }

  _detectTier(thresholds) {
    try {
      const totalMem = os.totalmem() / 1024 / 1024;
      const freeMem = os.freemem() / 1024 / 1024;
      console.log(`[RESOURCE] ${totalMem.toFixed(0)}MB total, ${freeMem.toFixed(0)}MB free`);
      if (!thresholds) thresholds = { minimal: 700, adaptive: 2000 };
      if (totalMem < thresholds.minimal) return 'minimal';
      if (totalMem < thresholds.adaptive) return 'adaptive';
      return 'full';
    } catch (e) {
      return 'adaptive';
    }
  }

  get tier() { return this._tier; }
  get isConstrained() { return this._tier !== 'full'; }

  onLoad(name, fn) {
    (this._loadHooks[name] = this._loadHooks[name] || []).push(fn);
    return this;
  }

  setCore(name, value) {
    this._core[name] = value;
    return this;
  }

  getCore(name) {
    return this._core[name];
  }

  register(name, deps, factory) {
    this._factories[name] = { deps, factory };
    return this;
  }

  async load(name) {
    if (this._core[name] !== undefined) return this._core[name];
    if (this._modules[name] !== undefined) return this._modules[name];
    if (this._loading[name]) return this._loading[name];
    if (!this._factories[name]) return null;

    console.log(`[LAZY] Loading ${name}...`);
    this._loading[name] = (async () => {
      try {
        const { deps, factory } = this._factories[name];
        const resolved = await Promise.all(deps.map(d => this.load(d)));
        const instance = await factory(...resolved, this);
        this._modules[name] = instance;
        delete this._loading[name];
        console.log(`[LAZY] [OK] ${name} loaded`);
        const hooks = this._loadHooks[name];
        if (hooks) hooks.forEach(fn => fn(instance));
        return instance;
      } catch (e) {
        delete this._loading[name];
        console.log(`[LAZY] [FAIL] ${name}: ${e.message}`);
        return null;
      }
    })();

    return this._loading[name];
  }

  get(name) {
    if (this._core[name] !== undefined) return this._core[name];
    if (this._modules[name] !== undefined) return this._modules[name];
    if (this._loading[name]) return undefined;
    if (this._factories[name]) {
      this.load(name).catch(() => {});
    }
    return undefined;
  }

  isLoaded(name) {
    return this._core[name] !== undefined || this._modules[name] !== undefined;
  }

  stats() {
    return {
      tier: this._tier,
      constrained: this.isConstrained,
      coreNames: Object.keys(this._core),
      loadedNames: Object.keys(this._modules),
      pendingNames: Object.keys(this._factories).filter(k => !this._modules[k] && !this._loading[k]),
      loadingNames: Object.keys(this._loading),
      totalFactories: Object.keys(this._factories).length
    };
  }

  getAll() {
    return { ...this._core, ...this._modules };
  }

  getAllLazy() {
    return new Proxy(this, {
      get: (target, prop) => target.get(prop) ?? target._core[prop] ?? target._modules[prop]
    });
  }

  async loadAll(names) {
    for (const name of names) {
      if (this._core[name] !== undefined || this._modules[name] !== undefined) continue;
      await this.load(name);
      await new Promise(r => setTimeout(r, 50));
    }
  }

  startBackgroundLoad(names, startCycle = 5, interval = 3) {
    let idx = 0;
    const timer = setInterval(() => {
      if (idx >= names.length) { clearInterval(timer); return; }
      const name = names[idx++];
      if (this._core[name] === undefined && this._modules[name] === undefined) {
        this.load(name).catch(() => {});
      }
      if (idx >= names.length) clearInterval(timer);
    }, interval * 1000);
    return timer;
  }
}

module.exports = { LazyBoot };
