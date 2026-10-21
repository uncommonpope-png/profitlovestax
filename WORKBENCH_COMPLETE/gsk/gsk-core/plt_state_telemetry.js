const fs = require('fs');
const path = require('path');

class PLTStateTelemetry {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(__dirname, '../data');
    this.telemetryFile = path.join(this.dataDir, 'plt_state_telemetry.json');
    this.state = {
      timestamp: Date.now(),
      pltVector: { profit: 0.8, love: 0.1, tax: 0.1 },
      entropy: 0.12,
      contextSaturation: 0.45,
      errorFrequency: 0.02,
      activeSetpoint: 'STABILITY'
    };
  }

  recordMetrics(metrics) {
    this.state = { ...this.state, ...metrics, timestamp: Date.now() };
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.telemetryFile, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error('Failed to write telemetry:', e);
    }
    return this.state;
  }

  getState() {
    return this.state;
  }
}

module.exports = { PLTStateTelemetry };
