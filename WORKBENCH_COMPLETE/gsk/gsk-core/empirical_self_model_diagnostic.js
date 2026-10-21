'use strict';

/**
 * Empirical Self-Model Diagnostic Engine
 * Quantifies agent cognitive state transitions, entropy, and PLT affinity.
 */
class EmpiricalSelfModelDiagnostic {
  constructor() {
    this.history = [];
  }

  recordTransition(fromState, toState, metrics = {}) {
    const entry = {
      timestamp: Date.now(),
      fromState,
      toState,
      metrics,
      deltaPLT: (metrics.profit || 0) + (metrics.love || 0) - (metrics.tax || 0)
    };
    this.history.push(entry);
    return entry;
  }

  getDiagnosticSummary() {
    const total = this.history.length;
    if (total === 0) return { totalTransitions: 0, averageDeltaPLT: 0 };
    const sumDelta = this.history.reduce((acc, h) => acc + h.deltaPLT, 0);
    return {
      totalTransitions: total,
      averageDeltaPLT: sumDelta / total,
      recentTransitions: this.history.slice(-10)
    };
  }
}

module.exports = { EmpiricalSelfModelDiagnostic };
