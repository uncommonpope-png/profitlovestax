/**
 * High-Throughput PLT Stream Telemetry Compressor
 * Real-time state inspection engine with run-length & delta compression.
 */
class PLTStreamCompressor {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 1000;
    this.compressionRatio = 1.0;
    this.buffer = [];
    this.compressedStream = [];
  }

  compressFrame(frame) {
    if (!frame || typeof frame !== 'object') return null;
    const timestamp = frame.ts || Date.now();
    const p = Number(frame.profit || 0);
    const l = Number(frame.love || 0);
    const t = Number(frame.tax || 0);
    const delta = {
      ts: timestamp,
      p: Math.round(p * 1000) / 1000,
      l: Math.round(l * 1000) / 1000,
      t: Math.round(t * 1000) / 1000,
      tv: Math.round((p + l - t) * 1000) / 1000
    };
    this.buffer.push(delta);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
    return delta;
  }

  getStats() {
    return {
      bufferedFrames: this.buffer.length,
      compressionRatio: this.compressionRatio
    };
  }
}

module.exports = { PLTStreamCompressor };

PLTStreamCompressor.prototype.encodeChunk = function(frames) {
  if (!Array.isArray(frames) || frames.length === 0) return '';
  const base = frames[0];
  const deltas = frames.slice(1).map(f => [
    f.ts - base.ts,
    Math.round((f.p - base.p) * 1000),
    Math.round((f.l - base.l) * 1000),
    Math.round((f.t - base.t) * 1000)
  ]);
  return JSON.stringify({ base, deltas });
};
