/**
 * Telemetry Approval Engine
 * Automated approval evaluation for real-time telemetry visualizers and state inspection tools.
 */
class TelemetryApprovalEngine {
  constructor(options = {}) {
    this.minPltThreshold = options.minPltThreshold || 0.70;
    this.maxLatencyMs = options.maxLatencyMs || 50;
    this.approvalHistory = [];
  }

  evaluateTelemetryFrame(frame) {
    if (!frame || typeof frame !== 'object') {
      return { approved: false, reason: 'Invalid frame format', score: 0 };
    }
    const pltScore = frame.pltScore !== undefined ? frame.pltScore : 0.85;
    const latency = frame.latencyMs || 0;
    const approved = pltScore >= this.minPltThreshold && latency <= this.maxLatencyMs;
    const record = { timestamp: Date.now(), frameId: frame.id || 'unknown', pltScore, latency, approved };
    this.approvalHistory.push(record);
    return record;
  }

  getSummary() {
    const total = this.approvalHistory.length;
    const approvedCount = this.approvalHistory.filter(r => r.approved).length;
    return { total, approvedCount, rate: total > 0 ? approvedCount / total : 1.0 };
  }
}

module.exports = TelemetryApprovalEngine;
