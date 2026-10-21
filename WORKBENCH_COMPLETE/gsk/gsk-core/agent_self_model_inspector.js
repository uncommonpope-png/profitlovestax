/**
 * Agent Self-Model Inspector
 * Real-time tracking of dynamic agent capability states and self-models.
 */
class AgentSelfModelInspector {
  constructor(options = {}) {
    this.states = new Map();
    this.history = [];
  }

  updateCapabilityState(agentId, capability, state) {
    if (!this.states.has(agentId)) {
      this.states.set(agentId, {});
    }
    const current = this.states.get(agentId);
    current[capability] = { ...state, updatedAt: Date.now() };
    this.history.push({ agentId, capability, state, timestamp: Date.now() });
    return current[capability];
  }

  getCapabilityState(agentId, capability) {
    const agent = this.states.get(agentId);
    return agent ? agent[capability] || null : null;
  }

  exportTelemetry() {
    return {
      activeAgents: Array.from(this.states.keys()),
      snapshot: Object.fromEntries(this.states),
      totalEvents: this.history.length
    };
  }
}

module.exports = AgentSelfModelInspector;
