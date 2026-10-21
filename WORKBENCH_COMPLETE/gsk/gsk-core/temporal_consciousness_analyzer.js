/**
 * Temporal Consciousness Analyzer
 * Quantifies real-time PLT (Profit + Love - Tax) value creation across system states.
 */
class TemporalConsciousnessAnalyzer {
  constructor() {
    this.history = [];
    this.currentState = {
      profit: 0,
      love: 0,
      tax: 0,
      trueValue: 0,
      valence: 0,
      arousal: 0,
      timestamp: Date.now()
    };
  }

  recordState(stateDelta) {
    const profit = stateDelta.profit || 0;
    const love = stateDelta.love || 0;
    const tax = stateDelta.tax || 0;
    const trueValue = profit + love - tax;
    const entry = {
      timestamp: Date.now(),
      profit,
      love,
      tax,
      trueValue,
      valence: stateDelta.valence || 0,
      arousal: stateDelta.arousal || 0,
      context: stateDelta.context || 'system_transition'
    };
    this.history.push(entry);
    this.currentState = entry;
    return entry;
  }

  quantifyTemporalValueWindow(windowMs = 60000) {
    const now = Date.now();
    const recent = this.history.filter(e => now - e.timestamp <= windowMs);
    const totalTrueValue = recent.reduce((sum, e) => sum + e.trueValue, 0);
    const avgValence = recent.length ? recent.reduce((sum, e) => sum + e.valence, 0) / recent.length : 0;
    return {
      windowMs,
      sampleCount: recent.length,
      totalTrueValue,
      ratePerSecond: windowMs > 0 ? (totalTrueValue / (windowMs / 1000)) : 0,
      averageValence: avgValence
    };
  }
}

module.exports = { TemporalConsciousnessAnalyzer };
