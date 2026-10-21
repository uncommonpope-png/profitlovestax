class PredictiveMemoryEngine {
  constructor() {
    this.history = [];
  }
  recordYield(timestamp, profit, love, tax) {
    const netYield = profit + love - tax;
    const entry = { timestamp, profit, love, tax, netYield };
    this.history.push(entry);
    return entry;
  }
  predictFutureYield(horizon = 5) {
    if (this.history.length === 0) return { projectedYield: 0, confidence: 0 };
    const recent = this.history.slice(-10);
    const avgYield = recent.reduce((acc, curr) => acc + curr.netYield, 0) / recent.length;
    const trend = recent.length > 1 ? (recent[recent.length - 1].netYield - recent[0].netYield) / recent.length : 0;
    return {
      forecastHorizon: horizon,
      projectedYield: avgYield + (trend * horizon),
      confidence: Math.min(1.0, 0.5 + (recent.length * 0.05))
    };
  }
}
module.exports = { PredictiveMemoryEngine };
