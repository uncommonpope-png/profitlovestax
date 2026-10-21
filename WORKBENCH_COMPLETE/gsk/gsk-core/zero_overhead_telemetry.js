/**
 * Zero-Overhead Telemetry Engine (GSK Core)
 * Monitors execution state using low-cost ring buffers and adaptive sampling to eliminate self-observation CPU tax.
 */
class ZeroOverheadTelemetry {
  constructor(options = {}) {
    this.bufferSize = options.bufferSize || 1000;
    this.ringBuffer = new Array(this.bufferSize);
    this.head = 0;
    this.count = 0;
    this.sampleRate = options.sampleRate || 0.05; // 5% default telemetry sample rate under load
    this.listeners = new Set();
    this.metrics = { dropped: 0, recorded: 0 };
  }

  record(topic, payload) {
    if (Math.random() > this.sampleRate) {
      this.metrics.dropped++;
      return;
    }
    const entry = {
      ts: Date.now(),
      topic,
      payload
    };
    this.ringBuffer[this.head] = entry;
    this.head = (this.head + 1) % this.bufferSize;
    this.count = Math.min(this.count + 1, this.bufferSize);
    this.metrics.recorded++;
  }

  getSnapshot() {
    const snapshot = [];
    for (let i = 0; i < this.count; i++) {
      const idx = (this.head - this.count + i + this.bufferSize) % this.bufferSize;
      if (this.ringBuffer[idx]) snapshot.push(this.ringBuffer[idx]);
    }
    return snapshot;
  }

  setSampleRate(rate) {
    this.sampleRate = Math.max(0.001, Math.min(1.0, rate));
  }
}

module.exports = ZeroOverheadTelemetry;
