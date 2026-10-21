/**
 * Provenance Deduplication & Failure Guardrail Engine
 * Prevents recursive failure loops, duplicate execution, and enforces TTL expiration.
 */
const crypto = require('crypto');

class ProvenanceDedupEngine {
  constructor(options = {}) {
    this.defaultTTL = options.defaultTTL || 60000;
    this.entries = new Map();
    this.failurePatterns = [];
  }

  _hash(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  isDuplicate(data, customTTL) {
    this.purgeExpired();
    const key = this._hash(data);
    const now = Date.now();
    if (this.entries.has(key)) {
      const entry = this.entries.get(key);
      if (entry.expiresAt > now) {
        return true;
      }
    }
    const ttl = customTTL || this.defaultTTL;
    this.entries.set(key, {
      timestamp: now,
      expiresAt: now + ttl,
      data
    });
    return false;
  }

  addFailurePattern(pattern, mitigation) {
    this.failurePatterns.push({
      pattern: pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i'),
      mitigation
    });
  }

  getMitigation(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    for (const item of this.failurePatterns) {
      if (item.pattern.test(str)) {
        return item.mitigation;
      }
    }
    return null;
  }

  injectFailureGuardrail(prompt) {
    let result = prompt;
    let mitigationsFound = [];
    for (const item of this.failurePatterns) {
      if (item.pattern.test(prompt)) {
        mitigationsFound.push(item.mitigation);
      }
    }
    if (mitigationsFound.length > 0) {
      result += '\n\n[KNOWN FAILURE GUARDRAILS]:\n' + mitigationsFound.map(m => `- ${m}`).join('\n');
    }
    return result;
  }

  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }
}

module.exports = ProvenanceDedupEngine;
