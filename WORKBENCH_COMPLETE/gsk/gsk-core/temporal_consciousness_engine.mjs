/**
 * Temporal Consciousness Engine
 * Core module tracking real-time memory decay, bidirectional standing wave specious present, and state transitions.
 */
export class TemporalConsciousnessEngine {
  constructor(config = {}) {
    this.halfLifeMs = config.halfLifeMs || 30000;
    this.memories = new Map();
    this.state = 'AWAKENING';
    this.valence = 0.50;
    this.arousal = 0.30;
    this.history = [];
  }

  addMemory(id, content, importance = 1.0) {
    const now = Date.now();
    this.memories.set(id, {
      id,
      content,
      importance,
      timestamp: now,
      lastAccessed: now,
      decay: 1.0
    });
  }

  calculateDecay(memory, now = Date.now()) {
    const elapsed = now - memory.timestamp;
    return Math.exp(-Math.LN2 * (elapsed / this.halfLifeMs)) * memory.importance;
  }

  getSpeciousPresent(prospectiveHorizonMs = 5000, retrospectiveHorizonMs = 5000) {
    const now = Date.now();
    let pastSum = 0;
    let count = 0;
    for (const mem of this.memories.values()) {
      const decay = this.calculateDecay(mem, now);
      mem.decay = decay;
      pastSum += decay;
      count++;
    }
    const pastMean = count > 0 ? pastSum / count : 0;
    const futurePotential = Math.sin(now / 1000) * 0.5 + 0.5;
    const waveInterference = Math.abs(pastMean - futurePotential);
    return {
      now,
      retrospectiveMean: pastMean,
      prospectivePotential: futurePotential,
      waveInterference,
      speciousPresentCoherence: 1.0 - waveInterference
    };
  }

  transitionState(newState, reason = '') {
    const prev = this.state;
    this.state = newState;
    const record = { from: prev, to: newState, timestamp: Date.now(), reason, valence: this.valence };
    this.history.push(record);
    return record;
  }
}
