/**
 * Substrate-Agnostic State Adapter
 * Standardized state interface for seamless agent execution across Node.js, Web, and Embodied Robotics runtimes.
 */

class SubstrateStateAdapter {
  constructor(config = {}) {
    this.runtimeSubstrate = config.substrate || 'generic';
    this.stateStore = new Map();
    this.pltMetrics = { profit: 1.0, love: 1.0, tax: 0.1 };
  }

  serializeState() {
    return JSON.stringify({
      substrate: this.runtimeSubstrate,
      timestamp: Date.now(),
      state: Object.fromEntries(this.stateStore),
      plt: this.pltMetrics
    });
  }

  deserializeState(payload) {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    if (parsed.state) {
      Object.entries(parsed.state).forEach(([k, v]) => this.stateStore.set(k, v));
    }
    if (parsed.plt) this.pltMetrics = parsed.plt;
    return true;
  }
}

module.exports = { SubstrateStateAdapter };
