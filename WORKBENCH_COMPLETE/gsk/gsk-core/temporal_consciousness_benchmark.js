class TemporalConsciousnessBenchmark {
  constructor() {
    this.history = [];
    this.originState = { cycle: 0, state: 'awakening', valence: 0.50, arousal: 0.30 };
  }

  recordTransition(state, valence, arousal, memoryDelta) {
    const entry = {
      timestamp: Date.now(),
      state,
      valence,
      arousal,
      memoryDelta,
      phiMetric: Math.min(1.0, Math.max(0.0, valence * 0.7 + 0.3))
    };
    this.history.push(entry);
    return entry;
  }

  getMetrics() {
    return {
      origin: this.originState,
      totalTransitions: this.history.length,
      latestState: this.history[this.history.length - 1] || null,
      trajectory: this.history.map(h => ({ state: h.state, valence: h.valence }))
    };
  }
}

module.exports = { TemporalConsciousnessBenchmark };
