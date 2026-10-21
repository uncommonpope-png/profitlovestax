const fs = require('fs');
const path = require('path');

class StreamingTelemetryEngine {
  constructor() {
    this.listeners = [];
    this.state = {
      profit: 1.0,
      love: 1.0,
      tax: 0.1,
      status: 'nominal'
    };
  }

  updateState(delta = {}) {
    this.state.profit = Math.max(0, this.state.profit + (delta.profit || 0));
    this.state.love = Math.max(0, this.state.love + (delta.love || 0));
    this.state.tax = Math.max(0.01, this.state.tax + (delta.tax || 0));
    
    const pltValue = (this.state.profit + this.state.love) - this.state.tax;
    const pltRatio = (this.state.profit + this.state.love) / this.state.tax;
    
    const telemetryFrame = {
      timestamp: Date.now(),
      componentState: { ...this.state },
      metrics: {
        pltValue,
        pltRatio
      }
    };
    
    this.listeners.forEach(fn => fn(telemetryFrame));
    return telemetryFrame;
  }

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

module.exports = { StreamingTelemetryEngine };
