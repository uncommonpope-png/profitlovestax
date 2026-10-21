const crypto = require('crypto');

class TelemetryDeduplicator {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 5000;
    this.seenHashes = new Map();
  }

  hashState(payload) {
    const canonical = JSON.stringify(payload, Object.keys(payload || {}).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  filter(event) {
    const now = Date.now();
    this.cleanup(now);
    const hash = this.hashState(event);
    if (this.seenHashes.has(hash)) {
      return { duplicate: true, suppressed: true, hash };
    }
    this.seenHashes.set(hash, now);
    return { duplicate: false, suppressed: false, hash, event };
  }

  cleanup(now) {
    for (const [hash, timestamp] of this.seenHashes.entries()) {
      if (now - timestamp > this.windowMs) {
        this.seenHashes.delete(hash);
      }
    }
  }
}

module.exports = { TelemetryDeduplicator };
