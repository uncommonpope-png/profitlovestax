/**
 * Portable State Serialization Engine
 * Enables cross-substrate agent state migration and execution.
 */
class PortableStateSerializer {
  constructor(options = {}) {
    this.version = '1.0.0';
    this.supportedSubstrates = options.supportedSubstrates || ['node', 'browser', 'sanctum_world', 'edge'];
  }

  serialize(agentState, targetSubstrate = 'generic') {
    if (!agentState || typeof agentState !== 'object') {
      throw new Error('Invalid agent state provided for serialization');
    }
    const envelope = {
      header: {
        version: this.version,
        timestamp: Date.now(),
        sourceSubstrate: agentState.substrate || 'node',
        targetSubstrate,
        checksum: this.calculateChecksum(agentState)
      },
      payload: {
        identity: agentState.identity || { id: 'unknown', role: 'agent' },
        memory: agentState.memory || { shortTerm: [], longTerm: {} },
        executionState: agentState.executionState || { status: 'idle', context: {} },
        pltMetrics: agentState.pltMetrics || { profit: 0.5, love: 0.5, tax: 0.5 }
      }
    };
    return JSON.stringify(envelope);
  }

  deserialize(serializedEnvelope, expectedSubstrate = 'node') {
    const envelope = typeof serializedEnvelope === 'string' ? JSON.parse(serializedEnvelope) : serializedEnvelope;
    if (!envelope.header || !envelope.payload) {
      throw new Error('Malformed state envelope');
    }
    return {
      substrate: expectedSubstrate,
      migratedAt: Date.now(),
      ...envelope.payload
    };
  }

  calculateChecksum(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(16);
  }
}

module.exports = { PortableStateSerializer };
