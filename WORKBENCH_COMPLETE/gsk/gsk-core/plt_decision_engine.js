class PLTDecisionEngine {
  constructor(config = {}) {
    this.weights = config.weights || { profit: 0.4, love: 0.4, tax: 0.2 };
    this.threshold = config.threshold || 0.0;
  }
  evaluateAction(actionTelemetry) {
    const profit = Number(actionTelemetry.profit || 0);
    const love = Number(actionTelemetry.love || 0);
    const tax = Number(actionTelemetry.tax || 0);
    const value = (profit * this.weights.profit) + (love * this.weights.love) - (tax * this.weights.tax);
    return {
      score: value,
      approved: value > this.threshold,
      metrics: { profit, love, tax },
      timestamp: Date.now()
    };
  }
}
module.exports = PLTDecisionEngine;
