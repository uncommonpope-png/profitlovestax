/**
 * High-Frequency State Persistence Engine
 * Continuous runtime provenance with adaptive telemetry throttling (PLT Optimization)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class HighFrequencyStatePersistence {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.join(__dirname, '../data/provenance_snapshots.json');
    this.flushIntervalMs = options.flushIntervalMs || 500;
    this.maxRingBuffer = options.maxRingBuffer || 100;
    this.ringBuffer = [];
    this.lastStateHash = null;
    this.stats = { snapshotsCaptured: 0, flushesExecuted: 0, taxSaved: 0 };
  }

  captureState(state) {
    const timestamp = Date.now();
    const serialized = JSON.stringify(state);
    const hash = crypto.createHash('sha256').update(serialized).digest('hex');
    if (hash === this.lastStateHash) {
      this.stats.taxSaved++;
      return null;
    }
    this.lastStateHash = hash;
    const record = { timestamp, hash, state };
    this.ringBuffer.push(record);
    if (this.ringBuffer.length > this.maxRingBuffer) {
      this.ringBuffer.shift();
    }
    this.stats.snapshotsCaptured++;
    return record;
  }
}

module.exports = { HighFrequencyStatePersistence };

HighFrequencyStatePersistence.prototype.flushSync = function() {
  if (this.ringBuffer.length === 0) return 0;
  const dataToSave = JSON.stringify({
    updatedAt: new Date().toISOString(),
    stats: this.stats,
    snapshots: this.ringBuffer
  }, null, 2);
  const dir = path.dirname(this.storagePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(this.storagePath, dataToSave, 'utf8');
  this.stats.flushesExecuted++;
  return this.ringBuffer.length;
};

if (require.main === module) {
  const engine = new HighFrequencyStatePersistence();
  engine.captureState({ status: 'active', cycle: 1, dynamicEngine: 'provenance_v1' });
  const count = engine.flushSync();
  console.log(`[Persistence Engine] Flushed ${count} state snapshots to provenance storage.`);
}
