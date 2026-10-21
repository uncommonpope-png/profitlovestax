/**
 * Substrate-Independent Agent State Serialization Protocol (v1.0.0)
 * Provides canonical context transport, state snapshotting, and cross-runtime payload normalization.
 */

class AgentStateEnvelope {
  constructor(agentId, runtimeSubstrate, stateData = {}) {
    this.protocol = 'GSK-STATE-SERIAL-v1';
    this.timestamp = new Date().toISOString();
    this.agentId = agentId;
    this.runtimeSubstrate = runtimeSubstrate;
    this.memoryVector = stateData.memoryVector || [];
    this.taskContext = stateData.taskContext || {};
    this.pltMetrics = stateData.pltMetrics || { profit: 1.0, love: 1.0, tax: 0.0 };
    this.checksum = this.computeChecksum();
  }

  computeChecksum() {
    const payload = JSON.stringify({ id: this.agentId, sub: this.runtimeSubstrate, ctx: this.taskContext });
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = ((hash << 5) - hash) + payload.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }

  serialize() {
    return JSON.stringify({
      protocol: this.protocol,
      timestamp: this.timestamp,
      agentId: this.agentId,
      runtimeSubstrate: this.runtimeSubstrate,
      memoryVector: this.memoryVector,
      taskContext: this.taskContext,
      pltMetrics: this.pltMetrics,
      checksum: this.checksum
    });
  }

  static deserialize(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed.protocol || !parsed.agentId) {
      throw new Error('Invalid agent state envelope format.');
    }
    const envelope = new AgentStateEnvelope(parsed.agentId, parsed.runtimeSubstrate, parsed);
    envelope.timestamp = parsed.timestamp;
    envelope.checksum = parsed.checksum;
    return envelope;
  }
}

module.exports = { AgentStateEnvelope };
