const fs = require('fs');
const path = require('path');

class TelemetryPipeline {
  constructor() {
    this.metrics = [];
    this.pltScore = { profit: 0, love: 0, tax: 0, net: 0 };
  }
  ingest(metric) {
    this.metrics.push({ timestamp: Date.now(), ...metric });
    if (this.metrics.length > 100) this.metrics.shift();
    this.optimize();
  }
  optimize() {
    let profit = this.metrics.reduce((acc, m) => acc + (m.profit || 0), 0);
    let love = this.metrics.reduce((acc, m) => acc + (m.love || 0), 0);
    let tax = this.metrics.reduce((acc, m) => acc + (m.tax || 0), 0);
    let count = Math.max(1, this.metrics.length);
    this.pltScore = {
      profit: Number((profit / count).toFixed(3)),
      love: Number((love / count).toFixed(3)),
      tax: Number((tax / count).toFixed(3)),
      net: Number(((profit + love - tax) / count).toFixed(3))
    };
  }
}

if (require.main === module) {
  const pipeline = new TelemetryPipeline();
  for (let i = 0; i < 10; i++) {
    pipeline.ingest({ profit: 0.8 + Math.random() * 0.2, love: 0.7 + Math.random() * 0.2, tax: 0.1 });
  }
  console.log('Telemetry Pipeline Initialized. Score:', JSON.stringify(pipeline.pltScore));
}

module.exports = TelemetryPipeline;
