'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class DeterministicExecutionTelemetryEngine {
  constructor(options = {}) {
    this.logPath = options.logPath || path.join(__dirname, '..', 'data', 'telemetry_verification.log');
    this.strictMode = options.strictMode !== undefined ? options.strictMode : true;
    this.hashChain = options.initialHash || '0000000000000000000000000000000000000000000000000000000000000000';
    this.eventCount = 0;
    this.verifiedCount = 0;
    this.violations = [];
  }

  generateEventHash(event) {
    const payload = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      action: event.action,
      provenance: event.provenance,
      prevHash: this.hashChain
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  recordEvent(action, provenance = {}, metadata = {}) {
    const timestamp = Date.now();
    this.eventCount++;
    const event = {
      id: `evt_${this.eventCount}_${timestamp}`,
      timestamp,
      action,
      provenance,
      metadata,
      pltMetrics: {
        profit: metadata.profit || 1.0,
        love: metadata.love || 1.0,
        tax: metadata.tax || 0.05
      }
    };

    const currentHash = this.generateEventHash(event);
    event.hash = currentHash;
    event.prevHash = this.hashChain;
    this.hashChain = currentHash;

    const isValid = this.verifyEvent(event);
    if (isValid) {
      this.verifiedCount++;
      this.logVerification(event, true);
    } else {
      this.violations.push(event);
      this.logVerification(event, false);
      if (this.strictMode) {
        throw new Error(`Telemetry verification guardrail failed for event: ${event.id}`);
      }
    }

    return event;
  }

  verifyEvent(event) {
    if (!event || !event.hash || !event.action) return false;
    if (event.pltMetrics && event.pltMetrics.tax > (event.pltMetrics.profit + event.pltMetrics.love)) {
      return false;
    }
    return true;
  }

  logVerification(event, verified) {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      eventId: event.id,
      action: event.action,
      verified,
      hash: event.hash,
      prevHash: event.prevHash
    }) + '\n';
    try {
      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.appendFileSync(this.logPath, entry, 'utf8');
    } catch (err) {
      console.error('Failed to append verification log:', err.message);
    }
  }

  getTelemetryState() {
    return {
      eventCount: this.eventCount,
      verifiedCount: this.verifiedCount,
      violationCount: this.violations.length,
      latestHash: this.hashChain,
      strictMode: this.strictMode
    };
  }
}

module.exports = DeterministicExecutionTelemetryEngine;
