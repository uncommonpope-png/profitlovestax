/**
 * Substrate-Independent Agent State Exporter
 * Normalizes agent states across web, Node.js, and browser environments.
 */
class AgentStateExporter {
  constructor(agentId = 'gsk-primary') {
    this.agentId = agentId;
  }

  exportState(stateObj, pltMetrics = {}) {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      agentId: this.agentId,
      state: stateObj,
      plt: {
        profit: pltMetrics.profit || 0.0,
        love: pltMetrics.love || 0.0,
        tax: pltMetrics.tax || 0.0,
        netValue: (pltMetrics.profit || 0.0) + (pltMetrics.love || 0.0) - (pltMetrics.tax || 0.0)
      }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AgentStateExporter };
}
