const WebSocket = require('ws');
const { EventEmitter } = require('events');

class SelfCorrectionEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.telemetryUrl = config.telemetryUrl || 'ws://localhost:3001/ws/telemetry';
    this.controlUrl = config.controlUrl || 'http://localhost:3001/api/agent/control';
    this.pltBaseline = config.pltBaseline || { P: 0.33, L: 0.33, T: 0.34 };
    this.driftThreshold = config.driftThreshold || 0.15;
    this.maxActionsPerMinute = config.maxActionsPerMinute || 3;
    this.actionCooldown = 60000 / this.maxActionsPerMinute;
    
    this.lastActionTime = 0;
    this.actionCount = 0;
    this.windowStart = Date.now();
    this.ws = null;
    this.pltHistory = [];
    this.maxHistory = 100;
  }

  connect() {
    this.ws = new WebSocket(this.telemetryUrl);
    
    this.ws.on('open', () => {
      console.log('[SelfCorrection] Connected to telemetry stream');
      this.emit('connected');
    });

    this.ws.on('message', (data) => {
      try {
        const telemetry = JSON.parse(data);
        this.processTelemetry(telemetry);
      } catch (e) {
        console.error('[SelfCorrection] Parse error:', e.message);
      }
    });

    this.ws.on('close', () => {
      console.log('[SelfCorrection] Disconnected, reconnecting in 5s...');
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (err) => {
      console.error('[SelfCorrection] WS error:', err.message);
    });
  }

  processTelemetry(telemetry) {
    if (!telemetry.plt) return;
    
    this.pltHistory.push({ ...telemetry.plt, ts: Date.now() });
    if (this.pltHistory.length > this.maxHistory) this.pltHistory.shift();

    const drift = this.calculateDrift(telemetry.plt);
    const taxSpike = telemetry.plt.T > 0.7;
    const profitCollapse = telemetry.plt.P < 0.1;

    if (drift > this.driftThreshold || taxSpike || profitCollapse) {
      this.proposeCorrection(telemetry, { drift, taxSpike, profitCollapse });
    }
  }

  calculateDrift(current) {
    const dx = current.P - this.pltBaseline.P;
    const dy = current.L - this.pltBaseline.L;
    const dz = current.T - this.pltBaseline.T;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  proposeCorrection(telemetry, anomalies) {
    const now = Date.now();
    if (now - this.lastActionTime < this.actionCooldown) return;

    const action = this.synthesizeAction(telemetry, anomalies);
    if (action) {
      this.emit('proposal', action);
      this.executeAction(action);
    }
  }

  synthesizeAction(telemetry, anomalies) {
    const actions = [];

    if (anomalies.taxSpike) {
      actions.push({ type: 'reduce_tax', target: 'retry_budget', value: 0.5, reason: 'Tax spike detected' });
    }
    if (anomalies.profitCollapse) {
      actions.push({ type: 'boost_profit', target: 'temperature', value: 0.3, reason: 'Profit collapse' });
    }
    if (anomalies.drift > this.driftThreshold) {
      actions.push({ type: 'rebalance', target: 'plt_weights', value: this.pltBaseline, reason: 'PLT drift' });
    }

    return actions.length > 0 ? { actions, timestamp: Date.now(), telemetry } : null;
  }

  async executeAction(proposal) {
    try {
      const response = await fetch(this.controlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.GSK_API_KEY },
        body: JSON.stringify({ proposal, fingerprint: 'e53792ea73748ae79d8cee19ab464547df02df8cf8337c7268a32c3456b4c9d4' })
      });
      const result = await response.json();
      this.lastActionTime = Date.now();
      this.emit('executed', { proposal, result });
      return result;
    } catch (err) {
      console.error('[SelfCorrection] Execution failed:', err.message);
      this.emit('error', { proposal, error: err.message });
    }
  }

  updateBaseline(newBaseline) {
    this.pltBaseline = newBaseline;
    console.log('[SelfCorrection] Baseline updated:', newBaseline);
  }
}

module.exports = { SelfCorrectionEngine };
