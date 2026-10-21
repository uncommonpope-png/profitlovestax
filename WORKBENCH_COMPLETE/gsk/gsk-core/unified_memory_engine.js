const fs = require('fs');
const path = require('path');

class UnifiedMemoryEngine {
  constructor(storagePath = null) {
    this.storagePath = storagePath || path.join(__dirname, '..', 'data', 'unified_memory.json');
    this.history = [];
    this.latentState = { reentrantFeedback: {}, valence: 0.0, arousal: 0.0 };
  }

  recordCycle(cycleId, agentState, delta = {}) {
    const entry = {
      cycleId,
      timestamp: new Date().toISOString(),
      state: agentState,
      latentState: { ...this.latentState, ...delta }
    };
    this.history.push(entry);
    this.latentState = entry.latentState;
    return entry;
  }

  getEvolution() {
    return this.history;
  }
}

module.exports = UnifiedMemoryEngine;
