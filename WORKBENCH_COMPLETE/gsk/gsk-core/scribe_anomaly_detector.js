class ScribeAnomalyDetector {
  constructor(options = {}) {
    this.maxTaxThreshold = options.maxTaxThreshold || 0.35;
    this.minProfitThreshold = options.minProfitThreshold || 0.40;
    this.staleCycleMs = options.staleCycleMs || 10000;
  }
  evaluateFrame(frame) {
    const anomalies = [];
    const tax = frame.tax || 0;
    const profit = frame.profit || 0;
    if (tax > this.maxTaxThreshold) anomalies.push({ code: 'EXCESSIVE_TAX', value: tax });
    if (profit < this.minProfitThreshold) anomalies.push({ code: 'DEFICIT_PROFIT', value: profit });
    return {
      valid: anomalies.length === 0,
      anomalies,
      pltScore: profit + (frame.love || 0) - tax
    };
  }
}
module.exports = { ScribeAnomalyDetector };
