'use strict';

/**
 * Lightweight Live Telemetry Streaming & Provenance Verification Engine
 */
class TelemetryProvenanceEngine {
  constructor(options = {}) {
    this.bufferSize = options.bufferSize || 100;
    this.telemetryFrames = [];
    this.provenanceMap = new Map();
  }

  pushFrame(agentId, state) {
    const timestamp = Date.now();
    const provenanceHash = this.computeHash(agentId, timestamp, state);
    const frame = {
      id: `frame_${timestamp}_${Math.random().toString(36).substring(2, 8)}`,
      agentId,
      timestamp,
      state,
      provenanceHash,
      verified: true
    };

    this.telemetryFrames.push(frame);
    if (this.telemetryFrames.length > this.bufferSize) {
      this.telemetryFrames.shift();
    }
    this.provenanceMap.set(frame.id, provenanceHash);
    return frame;
  }

  verifyFrame(frame) {
    if (!frame || !frame.provenanceHash) return false;
    const expectedHash = this.computeHash(frame.agentId, frame.timestamp, frame.state);
    return frame.provenanceHash === expectedHash;
  }

  computeHash(agentId, timestamp, state) {
    const str = `${agentId}:${timestamp}:${JSON.stringify(state)}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `prov_${Math.abs(hash).toString(16)}`;
  }

  getRecentFrames(limit = 10) {
    return this.telemetryFrames.slice(-limit);
  }
}

module.exports = TelemetryProvenanceEngine;
