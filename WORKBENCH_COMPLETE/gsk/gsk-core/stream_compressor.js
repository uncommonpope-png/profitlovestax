class TelemetryStreamCompressor {
  constructor(options = {}) {
    this.maxAgeMs = options.maxAgeMs || 5000;
    this.cache = new Map();
    this.stats = { rawBytes: 0, compressedBytes: 0, hits: 0, misses: 0 };
  }
  compress(streamId, payload) {
    const serialized = JSON.stringify(payload);
    const payloadBytes = Buffer.byteLength(serialized, 'utf8');
    this.stats.rawBytes += payloadBytes;
    const existing = this.cache.get(streamId);
    const now = Date.now();
    if (existing && existing.hash === serialized && (now - existing.timestamp) < this.maxAgeMs) {
      this.stats.hits++;
      const cachedRef = JSON.stringify({ streamId, cached: true, hash: serialized.length });
      this.stats.compressedBytes += Buffer.byteLength(cachedRef, 'utf8');
      return { streamId, status: 'CACHED', delta: null, timestamp: now };
    }
    this.cache.set(streamId, { hash: serialized, timestamp: now });
    this.stats.misses++;
    this.stats.compressedBytes += payloadBytes;
    return { streamId, status: 'UPDATED', delta: payload, timestamp: now };
  }
  getMetrics() {
    const ratio = this.stats.rawBytes > 0 ? (1 - (this.stats.compressedBytes / this.stats.rawBytes)) * 100 : 0;
    return { ...this.stats, reductionPercentage: ratio.toFixed(2) + '%' };
  }
}
module.exports = TelemetryStreamCompressor;
