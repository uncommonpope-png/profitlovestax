const fs = require('fs');

class TelemetryFeedbackLoop {
  constructor(intervalMs = 5000) {
    this.intervalMs = intervalMs;
    this.history = [];
  }

  recordMetrics(profit, love, tax) {
    const trueValue = profit + love - tax;
    const record = { timestamp: Date.now(), profit, love, tax, trueValue };
    this.history.push(record);
    return record;
  }
}

module.exports = TelemetryFeedbackLoop;
