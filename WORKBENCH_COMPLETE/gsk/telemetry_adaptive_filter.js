// Adaptive Telemetry Compression & Throttling Filter Engine
class AdaptiveTelemetryFilter {
  constructor(config = {}) {
    this.maxBatchSize = config.maxBatchSize || 100;
    this.sampleRate = config.sampleRate || 1.0;
    this.buffer = [];
  }
  ingest(metric) {
    if (Math.random() <= this.sampleRate) {
      this.buffer.push({ ...metric, ingestedAt: Date.now() });
    }
    if (this.buffer.length >= this.maxBatchSize) {
      return this.flush();
    }
    return [];
  }
  flush() {
    const batch = [...this.buffer];
    this.buffer = [];
    return batch;
  }
}
module.exports = AdaptiveTelemetryFilter;
