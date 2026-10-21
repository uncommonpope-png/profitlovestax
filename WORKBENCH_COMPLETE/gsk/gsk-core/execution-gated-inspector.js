/**
 * Execution-Gated Self-Inspector
 * Gates telemetry introspection cycles directly on operational code execution output.
 */
class ExecutionGatedInspector {
  constructor(options = {}) {
    this.executionCount = 0;
    this.pendingInspection = false;
    this.lastExecutionResult = null;
    this.inspectionHistory = [];
  }

  onCodeExecution(result) {
    this.executionCount++;
    this.lastExecutionResult = result;
    this.pendingInspection = true;
    return this.runGatedInspection();
  }

  runGatedInspection() {
    if (!this.pendingInspection) {
      return { status: 'gated', message: 'No immediate operational code execution detected. Inspection skipped.' };
    }
    this.pendingInspection = false;
    const record = {
      timestamp: Date.now(),
      executionId: this.executionCount,
      output: this.lastExecutionResult,
      status: 'inspected'
    };
    this.inspectionHistory.push(record);
    return record;
  }
}

module.exports = { ExecutionGatedInspector };
