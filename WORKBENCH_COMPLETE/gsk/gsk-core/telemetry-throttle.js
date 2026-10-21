'use strict';

class TelemetryThrottle {
  constructor(baseIntervalMs = 5000, maxIntervalMs = 60000) {
    this.baseIntervalMs = baseIntervalMs;
    this.maxIntervalMs = maxIntervalMs;
    this.currentIntervalMs = baseIntervalMs;
    this.cache = new Map();
  }

  shouldSample(key, changeDelta = 0) {
    const now = Date.now();
    const last = this.cache.get(key) || 0;
    if (changeDelta === 0 && (now - last) < this.currentIntervalMs) {
      this.currentIntervalMs = Math.min(this.currentIntervalMs * 1.5, this.maxIntervalMs);
      return false;
    }
    this.currentIntervalMs = this.baseIntervalMs;
    this.cache.set(key, now);
    return true;
  }
}

module.exports = { TelemetryThrottle };
