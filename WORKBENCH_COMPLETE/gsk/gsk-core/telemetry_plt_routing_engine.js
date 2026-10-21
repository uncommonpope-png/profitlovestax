/**
 * Telemetry-Gated PLT Routing Engine
 * Eliminates redundant sub-agent tasks using interoceptive telemetry vectors and PLT scoring.
 */

const crypto = require('crypto');

class TelemetryPltRoutingEngine {
  constructor(options = {}) {
    this.dedupCache = new Map();
    this.ttlMs = options.ttlMs || 60000;
    this.pltThreshold = options.pltThreshold || 0.1;
  }

  hashTask(task) {
    const payload = typeof task === 'string' ? task : JSON.stringify(task);
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  shouldExecute(task, telemetry = {}) {
    const hash = this.hashTask(task);
    const now = Date.now();
    if (this.dedupCache.has(hash)) {
      const entry = this.dedupCache.get(hash);
      if (now - entry.timestamp < this.ttlMs) {
        return { execute: false, reason: 'duplicate_task', cachedResult: entry.result };
      }
    }

    const profit = telemetry.profit || 1.0;
    const love = telemetry.love || 1.0;
    const tax = telemetry.tax || 0.1;
    const pltScore = profit + love - tax;

    if (pltScore < this.pltThreshold) {
      return { execute: false, reason: 'low_plt_score', pltScore };
    }

    return { execute: true, taskHash: hash, pltScore };
  }

  recordCompletion(taskHash, result) {
    this.dedupCache.set(taskHash, {
      timestamp: Date.now(),
      result
    });
  }
}

module.exports = TelemetryPltRoutingEngine;
