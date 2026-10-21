/**
 * Telemetry-Gated Hub-and-Spoke Sub-Agent Orchestrator
 * Architecture: Hub-and-Spoke with Epistemic Blackboard Verification
 */
class EpistemicBlackboard {
  constructor() {
    this.state = new Map();
    this.provenance = new Map();
  }

  publish(key, value, agentId, confidence = 1.0) {
    const entry = {
      value,
      agentId,
      confidence,
      timestamp: Date.now()
    };
    this.state.set(key, entry);
    if (!this.provenance.has(key)) {
      this.provenance.set(key, []);
    }
    this.provenance.get(key).push(entry);
    return entry;
  }

  get(key) {
    return this.state.get(key) || null;
  }

  getProvenance(key) {
    return this.provenance.get(key) || [];
  }
}

class TelemetryOrchestrator {
  constructor(config = {}) {
    this.maxDepth = config.maxDepth || 5;
    this.blackboard = new EpistemicBlackboard();
    this.agents = new Map();
    this.executionLog = [];
  }

  registerAgent(id, handler) {
    this.agents.set(id, handler);
  }

  async dispatch(task, agentId, depth = 0) {
    if (depth > this.maxDepth) {
      throw new Error(`Execution depth limit exceeded (${this.maxDepth}) for agent ${agentId}`);
    }

    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not registered`);
    }

    const startTime = Date.now();
    const result = await agent(task, this.blackboard);
    const duration = Date.now() - startTime;

    const record = {
      task,
      agentId,
      depth,
      duration,
      timestamp: Date.now()
    };
    this.executionLog.push(record);

    return {
      result,
      telemetry: record
    };
  }
}

module.exports = {
  EpistemicBlackboard,
  TelemetryOrchestrator
};
