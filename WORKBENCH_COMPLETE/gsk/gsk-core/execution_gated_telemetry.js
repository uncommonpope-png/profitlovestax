class ExecutionGatedTelemetry {
  constructor(config = {}) {
    this.gateThresholdMs = config.gateThresholdMs || 1000;
    this.lastExecutionTs = Date.now();
    this.metrics = { checksExecuted: 0, taxEliminated: 0 };
  }
  recordExecution() {
    this.lastExecutionTs = Date.now();
  }
  shouldInspect() {
    const idleDuration = Date.now() - this.lastExecutionTs;
    if (idleDuration > this.gateThresholdMs) {
      this.metrics.taxEliminated++;
      return false;
    }
    this.metrics.checksExecuted++;
    return true;
  }
  getReport() {
    return {
      idleMs: Date.now() - this.lastExecutionTs,
      gated: Date.now() - this.lastExecutionTs > this.gateThresholdMs,
      metrics: this.metrics
    };
  }
}
module.exports = ExecutionGatedTelemetry;
