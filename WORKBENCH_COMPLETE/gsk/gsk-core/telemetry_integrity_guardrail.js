class TelemetryIntegrityGuardrail {
  constructor(options = {}) {
    this.maxFrequencyHz = options.maxFrequencyHz || 60;
    this.requiredKeys = options.requiredKeys || ['timestamp', 'plt', 'agentState'];
    this.history = [];
  }

  validate(payload) {
    if (!payload || typeof payload !== 'object') return { valid: false, reason: 'Invalid payload structure' };
    for (const key of this.requiredKeys) {
      if (!(key in payload)) return { valid: false, reason: `Missing required key: ${key}` };
    }
    return { valid: true, timestamp: Date.now() };
  }
}

module.exports = { TelemetryIntegrityGuardrail };
