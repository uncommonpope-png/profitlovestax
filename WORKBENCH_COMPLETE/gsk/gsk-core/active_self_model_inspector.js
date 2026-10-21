/**
 * Active Self-Model State Inspector
 * Tracks dynamic agent capability changes, telemetry state, and PLT alignment.
 */

class ActiveSelfModelInspector {
  constructor(options = {}) {
    this.capabilities = new Map();
    this.history = [];
    this.pltScore = options.initialPLT || 1.0;
  }

  registerCapability(name, meta = {}) {
    const entry = {
      name,
      status: meta.status || 'active',
      confidence: meta.confidence || 1.0,
      updatedAt: Date.now()
    };
    this.capabilities.set(name, entry);
    this.history.push({ action: 'REGISTER', name, timestamp: Date.now() });
    return entry;
  }

  updateCapabilityStatus(name, status, confidence = 1.0) {
    if (!this.capabilities.has(name)) {
      return this.registerCapability(name, { status, confidence });
    }
    const existing = this.capabilities.get(name);
    existing.status = status;
    existing.confidence = confidence;
    existing.updatedAt = Date.now();
    this.history.push({ action: 'UPDATE', name, status, confidence, timestamp: Date.now() });
    return existing;
  }

  getCapabilityState(name) {
    return this.capabilities.get(name) || null;
  }

  inspectSelfModel() {
    const caps = Array.from(this.capabilities.values());
    const activeCount = caps.filter(c => c.status === 'active').length;
    const degradedCount = caps.filter(c => c.status === 'degraded').length;
    return {
      totalCapabilities: caps.length,
      activeCount,
      degradedCount,
      pltScore: this.pltScore,
      capabilities: caps,
      lastUpdated: Date.now()
    };
  }
}

module.exports = ActiveSelfModelInspector;
