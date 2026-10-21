class PLTAnalyzerEngine {
  constructor(options = {}) {
    this.weights = {
      profit: options.profitWeight || 1.0,
      love: options.loveWeight || 1.0,
      tax: options.taxWeight || 1.0
    };
    this.history = [];
    this.priors = {
      expectedProfit: options.expectedProfit || 10.0,
      expectedLove: options.expectedLove || 5.0,
      expectedTax: options.expectedTax || 2.0
    };
  }

  evaluateTransaction(tx) {
    const profit = Number(tx.profit || 0);
    const love = Number(tx.love || 0);
    const tax = Number(tx.tax || 0);

    const profitError = profit - this.priors.expectedProfit;
    const loveError = love - this.priors.expectedLove;
    const taxError = tax - this.priors.expectedTax;

    const rawPLT = (profit * this.weights.profit) + (love * this.weights.love) - (tax * this.weights.tax);
    const freeEnergy = Math.pow(profitError, 2) + Math.pow(loveError, 2) + Math.pow(taxError, 2);

    const alpha = 0.1;
    this.priors.expectedProfit += alpha * profitError;
    this.priors.expectedLove += alpha * loveError;
    this.priors.expectedTax += alpha * taxError;

    const record = {
      id: tx.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: tx.timestamp || Date.now(),
      rawPLT,
      freeEnergy,
      priors: { ...this.priors },
      score: rawPLT - (freeEnergy * 0.05)
    };

    this.history.push(record);
    return record;
  }

  evaluateStream(stream) {
    return stream.map(tx => this.evaluateTransaction(tx));
  }

  getMetrics() {
    if (this.history.length === 0) return { totalPLT: 0, count: 0, meanPLT: 0 };
    const totalPLT = this.history.reduce((acc, curr) => acc + curr.rawPLT, 0);
    return {
      totalPLT,
      count: this.history.length,
      meanPLT: totalPLT / this.history.length,
      latestPriors: { ...this.priors }
    };
  }
}

module.exports = { PLTAnalyzerEngine };