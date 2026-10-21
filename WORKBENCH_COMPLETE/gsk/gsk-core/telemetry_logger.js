/**
 * Automated Telemetry Logging System (RSMCL)
 * Tracks token entropy, context saturation, tool error rates, and PLT metrics.
 */
const fs = require('fs');
const path = require('path');

class TelemetryLogger {
  constructor(logPath) {
    this.logPath = logPath || path.join(__dirname, '..', 'data', 'agent_telemetry.json');
  }

  logMetric(metricType, value, payload = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      metricType,
      value,
      payload
    };
    let logs = [];
    if (fs.existsSync(this.logPath)) {
      try { logs = JSON.parse(fs.readFileSync(this.logPath, 'utf8')); } catch (e) { logs = []; }
    }
    logs.push(entry);
    fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2));
    return entry;
  }
}

module.exports = TelemetryLogger;
