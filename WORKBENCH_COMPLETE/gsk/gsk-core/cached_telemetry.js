const fs = require('fs');
const path = require('path');

class CachedTelemetryLayer {
  constructor(ttlMs = 5000) {
    this.ttlMs = ttlMs;
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, savedPolls: 0 };
  }

  getOrFetch(key, fetchFn) {
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && (now - cached.timestamp < this.ttlMs)) {
      this.stats.hits++;
      this.stats.savedPolls++;
      return cached.data;
    }
    this.stats.misses++;
    const data = fetchFn();
    this.cache.set(key, { timestamp: now, data });
    return data;
  }

  invalidate(key) {
    if (key) this.cache.delete(key);
    else this.cache.clear();
  }

  getStats() {
    return { ...this.stats, activeKeys: this.cache.size };
  }
}

module.exports = CachedTelemetryLayer;
