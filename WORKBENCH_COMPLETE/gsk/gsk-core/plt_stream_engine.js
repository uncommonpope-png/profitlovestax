const EventEmitter = require('events');

class PLTStreamEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.intervalMs = config.intervalMs || 1000;
    this.timer = null;
    this.stateHistory = [];
  }

  calculatePLT(profit, love, tax) {
    const netValue = profit + love - tax;
    return {
      profit,
      love,
      tax,
      netValue,
      score: netValue > 0 ? netValue : 0,
      timestamp: Date.now()
    };
  }

  startStreaming(agentStateProvider) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      const state = agentStateProvider();
      const pltMetrics = this.calculatePLT(state.profit || 0, state.love || 0, state.tax || 0);
      const telemetryFrame = { agentId: state.id || 'gsk-agent', state: state.status || 'active', metrics: pltMetrics };
      this.stateHistory.push(telemetryFrame);
      if (this.stateHistory.length > 500) this.stateHistory.shift();
      this.emit('telemetry', telemetryFrame);
    }, this.intervalMs);
  }

  stopStreaming() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

module.exports = { PLTStreamEngine };
