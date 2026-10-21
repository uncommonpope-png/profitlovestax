class TemporalMemoryEngine {
  constructor() {
    this.transitions = [];
  }
  recordTransition(fromState, toState, trigger, metadata = {}) {
    const entry = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      fromState,
      toState,
      trigger,
      metadata
    };
    this.transitions.push(entry);
    return entry;
  }
  getHistory(limit = 50) {
    return this.transitions.slice(-limit);
  }
}
module.exports = TemporalMemoryEngine;
