'use strict';

/**
 * Dynamic Emotional Valence Telemetry Module
 * Models valence dynamic mathematical function V(t) = tanh(W_p * Profit + W_l * Love - W_t * Tax + A * sin(omega * t))
 */
class ValenceTelemetry {
  constructor(config = {}) {
    this.wProfit = config.wProfit || 0.4;
    this.wLove = config.wLove || 0.4;
    this.wTax = config.wTax || 0.2;
    this.omega = config.omega || 0.05;
    this.amplitude = config.amplitude || 0.1;
  }

  computeValence(state, timestamp = Date.now()) {
    const profit = Number(state.profit || 0);
    const love = Number(state.love || 0);
    const tax = Number(state.tax || 0);
    const t = timestamp / 1000;
    const oscillation = this.amplitude * Math.sin(this.omega * t);
    const rawValence = (this.wProfit * profit) + (this.wLove * love) - (this.wTax * tax) + oscillation;
    return Math.max(-1, Math.min(1, Math.tanh(rawValence)));
  }
}

module.exports = { ValenceTelemetry };
