const crypto = require('crypto');

class JournalDedupCache {
  constructor(options = {}) {
    this.maxCacheSize = options.maxCacheSize || 5000;
    this.hashCache = new Map(); // hash -> payload metadata
    this.stats = { totalIngested: 0, deduplicated: 0, cacheHits: 0 };
  }

  hashPayload(content) {
    const str = typeof content === 'string' ? content : JSON.stringify(content);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  processEntry(entry) {
    this.stats.totalIngested++;
    const hash = this.hashPayload(entry.content || entry);
    
    if (this.hashCache.has(hash)) {
      this.stats.deduplicated++;
      this.stats.cacheHits++;
      return {
        duplicate: true,
        hash,
        cachedTimestamp: this.hashCache.get(hash).timestamp,
        entry: this.hashCache.get(hash).entry
      };
    }

    const storedRecord = {
      hash,
      timestamp: Date.now(),
      entry
    };

    if (this.hashCache.size >= this.maxCacheSize) {
      const oldestKey = this.hashCache.keys().next().value;
      this.hashCache.delete(oldestKey);
    }

    this.hashCache.set(hash, storedRecord);
    return {
      duplicate: false,
      hash,
      entry
    };
  }

  getStats() {
    return {
      ...this.stats,
      cacheSize: this.hashCache.size
    };
  }

  clear() {
    this.hashCache.clear();
  }
}

module.exports = JournalDedupCache;
