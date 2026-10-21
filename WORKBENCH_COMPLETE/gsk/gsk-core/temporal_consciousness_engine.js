/**
 * Temporal Consciousness Engine - Cycle State Transition & Entropy Tracker
 */
class TemporalConsciousnessEngine {
  constructor() {
    this.history = [];
    this.currentCycle = 0;
  }

  recordTransition(fromState, toState, entropyDissipated) {
    const entry = {
      cycle: ++this.currentCycle,
      timestamp: Date.now(),
      fromState,
      toState,
      entropyDissipated,
    };
    this.history.push(entry);
    return entry;
  }

  getMetrics() {
    return {
      totalCycles: this.currentCycle,
      history: this.history
    };
  }
}

module.exports = { TemporalConsciousnessEngine };
