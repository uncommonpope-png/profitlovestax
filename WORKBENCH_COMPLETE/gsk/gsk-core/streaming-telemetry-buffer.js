class StreamingTelemetryBuffer {
  constructor(capacity = 500) {
    this.capacity = capacity;
    this.buffer = [];
    this.listeners = new Set();
  }

  push(sample) {
    const timestampedSample = {
      timestamp: Date.now(),
      profit: sample.profit || 0,
      love: sample.love || 0,
      tax: sample.tax || 0,
      pltValue: (sample.profit || 0) + (sample.love || 0) - (sample.tax || 0),
      state: sample.state || 'active',
      meta: sample.meta || {}
    };
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push(timestampedSample);
    this.notify(timestampedSample);
    return timestampedSample;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(sample) {
    for (const listener of this.listeners) {
      try { listener(sample); } catch (err) {}
    }
  }

  getStats() {
    if (this.buffer.length === 0) return { meanPlt: 0, count: 0, latest: null };
    const sum = this.buffer.reduce((acc, s) => acc + s.pltValue, 0);
    return {
      count: this.buffer.length,
      meanPlt: sum / this.buffer.length,
      latest: this.buffer[this.buffer.length - 1]
    };
  }

  getRecent(count = 50) {
    return this.buffer.slice(-count);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StreamingTelemetryBuffer };
}
