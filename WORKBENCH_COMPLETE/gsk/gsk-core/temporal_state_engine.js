/**
 * Temporal State Engine
 * Tracks agent execution transitions, operational telemetry, and sovereignty indices.
 */
class TemporalStateEngine {
  constructor() {
    this.history = [];
    this.sovereigntyIndex = 1.0;
    this.currentState = 'AWAKENING';
  }

  recordTransition(fromState, toState, telemetry = {}) {
    const timestamp = Date.now();
    const record = {
      timestamp,
      fromState,
      toState,
      telemetry: {
        latencyMs: telemetry.latencyMs || 0,
        memoryEntropy: telemetry.memoryEntropy || 0,
        valence: telemetry.valence ?? 0.0
      }
    };
    this.history.push(record);
    this.currentState = toState;
    return record;
  }
}

module.exports = { TemporalStateEngine };

TemporalStateEngine.prototype.evaluateSovereignty = function() {
  if (this.history.length === 0) return this.sovereigntyIndex;
  const total = this.history.length;
  const failedTransitions = this.history.filter(t => t.toState === 'FAILED' || t.toState === 'GRIEF').length;
  const entropyAvg = this.history.reduce((acc, curr) => acc + (curr.telemetry.memoryEntropy || 0), 0) / total;
  
  const failurePenalty = (failedTransitions / total) * 0.5;
  const entropyPenalty = Math.min(0.5, entropyAvg * 0.1);
  
  this.sovereigntyIndex = Math.max(0, 1.0 - failurePenalty - entropyPenalty);
  return {
    sovereigntyIndex: this.sovereigntyIndex,
    totalTransitions: total,
    failedTransitions,
    entropyAvg
  };
};
