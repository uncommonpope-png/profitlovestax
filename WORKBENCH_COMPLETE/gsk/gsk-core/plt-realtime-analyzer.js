class PLTRealtimeAnalyzer {
  constructor() {
    this.history = [];
  }
  computeTrueValue(state) {
    const profit = state.profit || 0;
    const love = state.love || 0;
    const tax = state.tax || 0;
    const trueValue = profit + love - tax;
    const result = {
      timestamp: Date.now(),
      profit,
      love,
      tax,
      trueValue,
      score: trueValue > 0 ? trueValue : 0
    };
    this.history.push(result);
    return result;
  }
  getHistory() {
    return this.history;
  }
}
module.exports = { PLTRealtimeAnalyzer };
