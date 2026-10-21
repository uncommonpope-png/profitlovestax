class PLTValueAnalyzer {
  constructor() {
    this.history = [];
  }
  processStream(event) {
    const profit = Number(event.profit || 0);
    const love = Number(event.love || 0);
    const tax = Number(event.tax || 0);
    const trueValue = profit + love - tax;
    const entry = {
      timestamp: event.timestamp || Date.now(),
      profit,
      love,
      tax,
      trueValue,
      score: profit > tax ? trueValue : 0
    };
    this.history.push(entry);
    return entry;
  }
}

module.exports = PLTValueAnalyzer;
