/**
 * Multi-Modal Synthetic Sensory Streaming Pipeline
 * Maps telemetry, visual Sanctum signals, and PLT metrics into real-time sensory streams for agent awareness.
 */

class SyntheticSensoryPipeline {
  constructor(config = {}) {
    this.config = config;
    this.modalities = new Map();
    this.subscribers = new Set();
    this.active = false;
  }

  registerModality(name, generatorFn) {
    this.modalities.set(name, generatorFn);
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  start(intervalMs = 1000) {
    if (this.active) return;
    this.active = true;
    this.timer = setInterval(() => this.tick(), intervalMs);
  }

  stop() {
    this.active = false;
    if (this.timer) clearInterval(this.timer);
  }

  tick() {
    const frame = {
      timestamp: Date.now(),
      streams: {}
    };
    for (const [name, generator] of this.modalities.entries()) {
      try {
        frame.streams[name] = generator();
      } catch (err) {
        frame.streams[name] = { error: err.message };
      }
    }
    for (const sub of this.subscribers) {
      sub(frame);
    }
  }
}

module.exports = { SyntheticSensoryPipeline };
