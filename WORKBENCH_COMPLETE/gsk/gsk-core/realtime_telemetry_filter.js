/**
 * Real-Time Telemetry Filtering Module
 * Filters high-frequency telemetry events to optimize empirical self-model diagnostic loops.
 */

class RealtimeTelemetryFilter {
  constructor(options = {}) {
    this.maxFrequencyMs = options.maxFrequencyMs || 100;
    this.buffer = [];
    this.lastFlush = Date.now();
  }

  filterEvent(event) {
    if (!event || !event.type) return false;
    // Deduplicate and suppress low-signal telemetry noise
    if (event.type === 'HEARTBEAT' && event.deltaMs < 50) return false;
    this.buffer.push({ ...event, timestamp: Date.now() });
    return true;
  }

  flush() {
    const items = [...this.buffer];
    this.buffer = [];
    this.lastFlush = Date.now();
    return items;
  }
}

module.exports = { RealtimeTelemetryFilter };
