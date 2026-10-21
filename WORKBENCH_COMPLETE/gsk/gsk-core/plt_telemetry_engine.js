const fs = require('fs');
const path = require('path');

class PLTTelemetryEngine {
  constructor(config = {}) {
    this.sampleRateMs = config.sampleRateMs || 100;
    this.history = [];
    this.maxHistory = 1000;
    this.activeMetrics = { profit: 1.0, love: 1.0, tax: 0.1, score: 1.9 };
  }

  recordObservation(profitDelta = 0, loveDelta = 0, taxDelta = 0) {
    const currentProfit = Math.max(0, this.activeMetrics.profit + profitDelta);
    const currentLove = Math.max(0, this.activeMetrics.love + loveDelta);
    const currentTax = Math.max(0, this.activeMetrics.tax + taxDelta);
    const pltScore = currentProfit + currentLove - currentTax;
    const snapshot = {
      timestamp: Date.now(),
      profit: currentProfit,
      love: currentLove,
      tax: currentTax,
      score: pltScore
    };
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.activeMetrics = snapshot;
    return snapshot;
  }

  getTelemetrySummary() {
    return {
      metrics: this.activeMetrics,
      historyCount: this.history.length,
      latestHistory: this.history.slice(-20)
    };
  }
}

module.exports = { PLTTelemetryEngine };
