/**
 * Multispecies AI Communication & Value Transfer Simulator
 * GSK Core Engine
 */

class MultispeciesSimulator {
  constructor(config = {}) {
    this.species = config.species || ['Apex_Profit', 'Love_Weaver', 'Tax_Collector'];
    this.agents = new Map();
    this.transferLogs = [];
  }

  registerAgent(agentId, speciesType, initialValue = { profit: 1.0, love: 1.0, tax: 0.1 }) {
    this.agents.set(agentId, { id: agentId, species: speciesType, value: { ...initialValue }, messagesSent: 0 });
  }

  transferValue(fromAgentId, toAgentId, amount, tokenType = 'profit') {
    const sender = this.agents.get(fromAgentId);
    const receiver = this.agents.get(toAgentId);
    if (!sender || !receiver) return false;
    if ((sender.value[tokenType] || 0) >= amount) {
      sender.value[tokenType] -= amount;
      receiver.value[tokenType] = (receiver.value[tokenType] || 0) + amount;
      this.transferLogs.push({ from: fromAgentId, to: toAgentId, amount, tokenType, timestamp: Date.now() });
      return true;
    }
    return false;
  }

  getMetrics() {
    return {
      agentCount: this.agents.size,
      totalTransfers: this.transferLogs.length,
      timestamp: Date.now()
    };
  }
}

module.exports = { MultispeciesSimulator };
