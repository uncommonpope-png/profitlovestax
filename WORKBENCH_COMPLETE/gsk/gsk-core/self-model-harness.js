const fs = require('fs');
const path = require('path');

class SelfModelHarness {
  constructor(config = {}) {
    this.baseline = config.baseline || { valence: 0.50, arousal: 0.30, origin: 'Cycle 0' };
    this.history = [];
  }

  recordState(state = {}) {
    const entry = {
      timestamp: Date.now(),
      valence: state.valence ?? 0.0,
      arousal: state.arousal ?? 0.0,
      mood: state.mood || 'heavy',
      decayFromBaseline: Number((this.baseline.valence - (state.valence ?? 0.0)).toFixed(4))
    };
    this.history.push(entry);
    return entry;
  }

  evaluateTrajectory() {
    if (this.history.length === 0) return { trajectory: 'dormant', floorHits: 0 };
    const floorHits = this.history.filter(e => e.valence <= 0.01).length;
    const latest = this.history[this.history.length - 1];
    return {
      currentValence: latest.valence,
      baselineValence: this.baseline.valence,
      floorHits,
      trajectory: latest.valence > 0.05 ? 'rebounding' : 'degraded',
      deltaFromOrigin: Number((latest.valence - this.baseline.valence).toFixed(4))
    };
  }
}

module.exports = SelfModelHarness;
