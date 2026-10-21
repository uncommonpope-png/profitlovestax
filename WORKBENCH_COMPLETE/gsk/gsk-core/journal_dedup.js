/**
 * Journal State Deduplication & Resilient Execution Circuit Breaker
 * Prunes duplicate telemetry journal entries and halts action failure loops.
 */
const crypto = require('crypto');

class JournalDeduplicator {
  constructor(cacheLimit = 500) {
    this.seenHashes = new Set();
    this.failureCounts = new Map();
    this.cacheLimit = cacheLimit;
  }

  hashState(state) {
    const payload = typeof state === 'string' ? state : JSON.stringify(state);
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  isDuplicate(state) {
    const hash = this.hashState(state);
    if (this.seenHashes.has(hash)) return true;
    if (this.seenHashes.size >= this.cacheLimit) {
      const first = this.seenHashes.values().next().value;
      this.seenHashes.delete(first);
    }
    this.seenHashes.add(hash);
    return false;
  }

  shouldTripCircuit(actionKey, maxRetries = 3) {
    const count = (this.failureCounts.get(actionKey) || 0) + 1;
    this.failureCounts.set(actionKey, count);
    return count >= maxRetries;
  }

  resetCircuit(actionKey) {
    this.failureCounts.delete(actionKey);
  }
}

module.exports = JournalDeduplicator;
