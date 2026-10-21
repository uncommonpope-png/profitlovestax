// PLT Matrix Simulator
// Formula: Profit + Love - Tax = True Value

class PLTMatrixSimulator {
  constructor(config = {}) {
    this.weights = {
      profit: config.profitWeight || 0.4,
      love: config.loveWeight || 0.4,
      tax: config.taxWeight || 0.2
    };
  }

  simulateMatrix(scenarios) {
    return scenarios.map(s => {
      const profit = (s.revenue || 0) - (s.operatingCost || 0);
      const love = (s.userEngagement || 0) * (s.retentionRate || 1);
      const tax = (s.frictionCost || 0) + (s.riskCost || 0) + ((s.taxRate || 0.15) * profit);
      const trueValue = profit + love - tax;
      return { id: s.id || 'scenario_' + Math.random().toString(36).substr(2, 5), profit, love, tax, trueValue };
    }).sort((a, b) => b.trueValue - a.trueValue);
  }

  optimizeYield(scenarios) {
    const results = this.simulateMatrix(scenarios);
    return {
      bestScenario: results[0] || null,
      allResults: results,
      maximizedProfit: results[0]?.profit || 0,
      minimizedTax: results[0]?.tax || 0
    };
  }
}

module.exports = { PLTMatrixSimulator };
