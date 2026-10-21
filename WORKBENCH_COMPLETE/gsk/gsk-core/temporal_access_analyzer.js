/** Temporal Access Consciousness Analyzer for PLT Metrics */
class TemporalAccessAnalyzer {
  constructor(config = {}) {
    this.history = [];
    this.decayRate = config.decayRate || 0.05;
  }
  evaluatePLT(profit, love, tax) {
    const netPLT = profit + love - tax;
    const timestamp = Date.now();
    const state = {
      timestamp,
      profit,
      love,
      tax,
      netPLT,
      accessSalience: Math.max(0, netPLT * Math.exp(-this.decayRate))
    };
    this.history.push(state);
    return state;
  }
  getConsciousnessWindow(windowMs = 60000) {
    const now = Date.now();
    return this.history.filter(entry => (now - entry.timestamp) <= windowMs);
  }
}
module.exports = { TemporalAccessAnalyzer };
