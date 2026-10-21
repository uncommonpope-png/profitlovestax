/**
 * Automated PLT State Assertions Engine
 * Validates PLT telemetry state invariants programmatically to eliminate visual inspection overhead.
 */
class PLTStateAssertions {
  constructor(config = {}) {
    this.minProfitTaxRatio = config.minProfitTaxRatio || 1.0;
    this.maxTaxThreshold = config.maxTaxThreshold || 0.90;
    this.minLoveThreshold = config.minLoveThreshold || 0.05;
  }

  assertStateInvariants(state) {
    const violations = [];
    if (!state || typeof state !== 'object') {
      return { valid: false, violations: ['Invalid or null telemetry state object'] };
    }

    const profit = Number(state.profit || 0);
    const love = Number(state.love || 0);
    const tax = Number(state.tax || 0);

    if (tax > this.maxTaxThreshold) {
      violations.push(`Tax (${tax}) exceeds threshold (${this.maxTaxThreshold})`);
    }
    if (love < this.minLoveThreshold) {
      violations.push(`Love (${love}) below threshold (${this.minLoveThreshold})`);
    }
    if (profit <= tax) {
      violations.push(`Profit (${profit}) must exceed Tax (${tax}) for positive net value`);
    }

    return {
      valid: violations.length === 0,
      violations,
      metrics: { profit, love, tax, netValue: profit + love - tax }
    };
  }

  runBatchAssertions(stateHistory = []) {
    return stateHistory.map((s, idx) => ({
      index: idx,
      ...this.assertStateInvariants(s)
    }));
  }
}

module.exports = { PLTStateAssertions };
