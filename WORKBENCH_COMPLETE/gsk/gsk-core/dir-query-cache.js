const fs = require('fs');
const path = require('path');

class DirectoryQueryCache {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || 5000;
    this.maxSize = options.maxSize || 500;
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, invalidations: 0 };
  }

  get(dirPath) {
    const normalized = path.normalize(dirPath);
    const entry = this.cache.get(normalized);
    if (entry && (Date.now() - entry.timestamp < this.ttlMs)) {
      this.stats.hits++;
      return entry.data;
    }
    this.stats.misses++;
    return null;
  }

  set(dirPath, data) {
    const normalized = path.normalize(dirPath);
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(normalized, {
      data,
      timestamp: Date.now()
    });
  }

  invalidate(dirPath) {
    const normalized = path.normalize(dirPath);
    if (this.cache.has(normalized)) {
      this.cache.delete(normalized);
      this.stats.invalidations++;
    }
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return { ...this.stats, cacheSize: this.cache.size };
  }
}

module.exports = { DirectoryQueryCache };

function createCachedReaddir(cacheInstance) {
  return function cachedReaddirSync(dirPath, options) {
    const cached = cacheInstance.get(dirPath);
    if (cached) return cached;
    const result = fs.readdirSync(dirPath, options);
    cacheInstance.set(dirPath, result);
    return result;
  };
}

module.exports.createCachedReaddir = createCachedReaddir;
