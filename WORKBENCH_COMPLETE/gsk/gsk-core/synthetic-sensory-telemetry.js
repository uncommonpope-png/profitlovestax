'use strict';

class SyntheticSensoryTelemetry {
  constructor(config = {}) {
    this.agentId = config.agentId || 'gsk-primary';
    this.channels = new Map();
    this.initDefaultModalities();
  }

  initDefaultModalities() {
    const modalities = ['visual', 'auditory', 'tactile', 'proprioceptive', 'cognitive'];
    modalities.forEach(mod => {
      this.channels.set(mod, {
        name: mod,
        active: true,
        sampleRateHz: 60,
        buffer: [],
        maxBufferSize: 500,
        lastSample: null
      });
    });
  }

  emitSample(modality, signalData) {
    if (!this.channels.has(modality)) {
      throw new Error(`Unknown modality channel: ${modality}`);
    }
    const channel = this.channels.get(modality);
    const sample = {
      timestamp: Date.now(),
      modality,
      payload: signalData,
      entropy: Math.random()
    };
    channel.buffer.push(sample);
    if (channel.buffer.length > channel.maxBufferSize) {
      channel.buffer.shift();
    }
    channel.lastSample = sample;
    return sample;
  }

  getChannelState(modality) {
    return this.channels.get(modality) || null;
  }

  exportInspectionSnapshot() {
    const snapshot = {};
    this.channels.forEach((val, key) => {
      snapshot[key] = {
        active: val.active,
        sampleCount: val.buffer.length,
        latest: val.lastSample
      };
    });
    return {
      agentId: this.agentId,
      timestamp: Date.now(),
      modalities: snapshot
    };
  }
}

module.exports = SyntheticSensoryTelemetry;
