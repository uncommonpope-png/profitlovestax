/**
 * Access Consciousness Analyzer
 * Maps real-time agent state availability (cognitive bandwidth, reachability, execution capacity)
 * to PLT (Profit + Love - Tax) value metrics.
 */
class AccessConsciousnessAnalyzer {
  constructor() {
    this.stateRegistry = new Map();
  }

  registerAgentState(agentId, availabilityState) {
    const pltMetrics = this.calculatePLTValue(availabilityState);
    const record = {
      agentId,
      state: availabilityState,
      plt: pltMetrics,
      timestamp: Date.now()
    };
    this.stateRegistry.set(agentId, record);
    return record;
  }

  calculatePLTValue(state) {
    const bandwidth = state.cognitiveBandwidth || 0.5;
    const efficiency = state.taskEfficiency || 0.5;
    const trust = state.userTrust || 0.5;
    const risk = state.errorRisk || 0.1;
    const computeCost = state.computeCost || 0.1;

    const profit = Number((bandwidth * efficiency * 1.5).toFixed(4));
    const love = Number((trust * (state.collaborationIndex || 0.5)).toFixed(4));
    const tax = Number((computeCost + risk).toFixed(4));
    const trueValue = Number((profit + love - tax).toFixed(4));

    return { profit, love, tax, trueValue };
  }

  getAgentPLT(agentId) {
    return this.stateRegistry.get(agentId) || null;
  }

  getAllStates() {
    return Array.from(this.stateRegistry.values());
  }
}

module.exports = AccessConsciousnessAnalyzer;
