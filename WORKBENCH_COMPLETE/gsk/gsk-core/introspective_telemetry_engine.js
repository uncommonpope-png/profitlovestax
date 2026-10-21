const fs = require('fs');
const path = require('path');

class IntrospectiveTelemetryEngine {
  constructor(options = {}) {
    this.intervalMs = options.intervalMs || 500;
    this.active = false;
    this.metricsHistory = [];
    this.state = {
      profit: 1.0,
      love: 1.0,
      tax: 0.05,
      operationalState: 'INITIALIZING',
      lastRefinement: Date.now()
    };
  }

  start() {
    this.active = true;
    this.timer = setInterval(() => this.tick(), this.intervalMs);
    return { status: 'active', intervalMs: this.intervalMs };
  }

  stop() {
    this.active = false;
    if (this.timer) clearInterval(this.timer);
    return { status: 'stopped' };
  }

  tick() {
    const now = Date.now();
    const trueValue = this.state.profit + this.state.love - this.state.tax;
    const snapshot = {
      timestamp: now,
      state: this.state.operationalState,
      plt: {
        profit: Number(this.state.profit.toFixed(4)),
        love: Number(this.state.love.toFixed(4)),
        tax: Number(this.state.tax.toFixed(4)),
        trueValue: Number(trueValue.toFixed(4))
      },
      memUsage: process.memoryUsage().heapUsed
    };
    this.metricsHistory.push(snapshot);
    if (this.metricsHistory.length > 1000) this.metricsHistory.shift();
    return snapshot;
  }

  refineOperationalState(newState, deltaPLT = {}) {
    this.state.operationalState = newState;
    if (typeof deltaPLT.profit === 'number') this.state.profit += deltaPLT.profit;
    if (typeof deltaPLT.love === 'number') this.state.love += deltaPLT.love;
    if (typeof deltaPLT.tax === 'number') this.state.tax = Math.max(0, this.state.tax + deltaPLT.tax);
    this.state.lastRefinement = Date.now();
    return this.getTelemetryReport();
  }

  getTelemetryReport() {
    return {
      currentState: this.state,
      historyLength: this.metricsHistory.length,
      latestSnapshot: this.metricsHistory[this.metricsHistory.length - 1] || null
    };
  }
}

module.exports = IntrospectiveTelemetryEngine;
