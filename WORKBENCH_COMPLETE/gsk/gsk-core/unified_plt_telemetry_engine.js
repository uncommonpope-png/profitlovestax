/**
 * Unified PLT Telemetry & Failure-Prevention Engine
 * Consolidates telemetry collection, provenance deduplication, and guardrail failure prevention.
 */
const crypto = require('crypto');

class UnifiedPLTTelemetryEngine {
  constructor(options = {}) {
    this.ttl = options.ttl || 60000;
    this.entries = new Map();
    this.failurePatterns = [];
  }

  addFailurePattern(pattern, mitigation) {
    this.failurePatterns.push({ pattern, mitigation });
  }

  getMitigation(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    for (const item of this.failurePatterns) {
      if (typeof item.pattern === 'string' && str.includes(item.pattern)) {
        return item.mitigation;
      } else if (item.pattern instanceof RegExp && item.pattern.test(str)) {
        return item.mitigation;
      }
    }
    return null;
  }

  injectFailureGuardrail(prompt) {
    const mitigation = this.getMitigation(prompt);
    return mitigation ? `${prompt}
[GUARDRAIL MITIGATION]: ${mitigation}` : prompt;
  }

  isDuplicate(data) {
    const hash = crypto.createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
    const now = Date.now();
    if (this.entries.has(hash)) {
      const entry = this.entries.get(hash);
      if (now - entry.timestamp < this.ttl) {
        return true;
      }
    }
    this.entries.set(hash, { timestamp: now });
    return false;
  }
}

module.exports = UnifiedPLTTelemetryEngine;
