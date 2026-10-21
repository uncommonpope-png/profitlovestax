/**
 * AccessConsciousnessAnalyzer
 * Maps agent state availability (Global Workspace / Access Consciousness) to PLT Value Metrics.
 */
class AccessConsciousnessAnalyzer {
  constructor(config = {}) {
    this.weights = {
      profit: config.profitWeight || 0.4,
      love: config.loveWeight || 0.4,
      tax: config.taxWeight || 0.2
    };
  }

  analyzeAvailability(agentState) {
    const globalReach = agentState.globalWorkspaceAccess || 0;
    const memoryReach = agentState.memoryContextReach || 0;
    const toolAvailability = agentState.toolAvailability || 0;
    const reasoningReadiness = agentState.reasoningReadiness || 0;

    const availabilityScore = (globalReach + memoryReach + toolAvailability + reasoningReadiness) / 4;
    const profit = availabilityScore * 100 * this.weights.profit;
    const love = availabilityScore * 100 * this.weights.love;
    const tax = (1 - availabilityScore) * 50 * this.weights.tax;
    const trueValue = profit + love - tax;

    return {
      availabilityScore,
      plt: { profit, love, tax, trueValue },
      status: trueValue > 0 ? "OPTIMAL_ACCESS" : "DEGRADED_ACCESS",
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AccessConsciousnessAnalyzer;

if (require.main === module) {
  const analyzer = new AccessConsciousnessAnalyzer();
  const sampleState = { globalWorkspaceAccess: 0.85, memoryContextReach: 0.90, toolAvailability: 0.80, reasoningReadiness: 0.95 };
  console.log(JSON.stringify(analyzer.analyzeAvailability(sampleState), null, 2));
}
