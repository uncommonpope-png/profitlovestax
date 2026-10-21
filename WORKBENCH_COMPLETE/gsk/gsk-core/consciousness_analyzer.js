/**
 * Consciousness Meta-Framework Analyzer
 * Maps temporal execution states to PLT true value (Profit + Love - Tax).
 */
class ConsciousnessAnalyzer {
  constructor() {
    this.history = [];
  }

  analyzeState(executionState) {
    const profit = Number(executionState.profit || 0);
    const love = Number(executionState.love || 0);
    const tax = Number(executionState.tax || 0);
    const trueValue = profit + love - tax;

    const record = {
      timestamp: executionState.timestamp || Date.now(),
      stateId: executionState.id || `state_${Date.now()}`,
      valence: executionState.valence || 0,
      profit,
      love,
      tax,
      trueValue,
      scoreValid: trueValue > 0
    };

    this.history.push(record);
    return record;
  }

  getTemporalTrajectory() {
    return this.history.slice().sort((a, b) => a.timestamp - b.timestamp);
  }
}

module.exports = { ConsciousnessAnalyzer };
