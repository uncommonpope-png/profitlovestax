class PLTTemporalEngine {
  constructor(config = {}) {
    this.weights = config.weights || { profit: 1.0, love: 1.0, tax: 1.0 };
    this.history = [];
  }
  quantifyStateTransition(prevState, nextState, deltaTimeMs) {
    const profitDelta = (nextState.profit || 0) - (prevState.profit || 0);
    const loveDelta = (nextState.love || 0) - (prevState.love || 0);
    const taxDelta = (nextState.tax || 0) - (prevState.tax || 0);
    const netValue = (profitDelta * this.weights.profit) + (loveDelta * this.weights.love) - (taxDelta * this.weights.tax);
    const temporalValueRate = deltaTimeMs > 0 ? netValue / (deltaTimeMs / 1000) : netValue;
    const record = { timestamp: Date.now(), deltaTimeMs, profitDelta, loveDelta, taxDelta, netValue, temporalValueRate };
    this.history.push(record);
    return record;
  }
}
module.exports = { PLTTemporalEngine };
