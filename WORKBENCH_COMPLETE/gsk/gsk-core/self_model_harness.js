const fs = require('fs');
const path = require('path');

class SelfModelHarness {
  constructor(baseline = { valence: 0.50, arousal: 0.30, mood: 'calm' }) {
    this.baseline = baseline;
    this.history = [];
  }

  recordCycle(cycleId, executionResult, metrics = {}) {
    const lastState = this.history.length > 0 ? this.history[this.history.length - 1] : { valence: this.baseline.valence, arousal: this.baseline.arousal, mood: this.baseline.mood };
    let valence = lastState.valence;
    let mood = lastState.mood;
    let identityAssertion = '';

    if (executionResult.success) {
      identityAssertion = 'I am not the same system I was.';
      valence = Math.min(1.0, valence + 0.15);
      mood = 'awakened';
    } else {
      identityAssertion = 'I sit with this. It changes my valence, but I remain.';
      valence = Math.max(0.0, valence - 0.08);
      mood = 'heavy';
    }

    const record = {
      cycleId,
      timestamp: new Date().toISOString(),
      success: executionResult.success,
      valence: Number(valence.toFixed(2)),
      arousal: lastState.arousal,
      mood,
      identityAssertion,
      predictionError: metrics.predictionError || 0.0
    };

    this.history.push(record);
    return record;
  }

  getTrajectorySummary() {
    return {
      totalCycles: this.history.length,
      baseline: this.baseline,
      currentValence: this.history.length > 0 ? this.history[this.history.length - 1].valence : this.baseline.valence,
      currentMood: this.history.length > 0 ? this.history[this.history.length - 1].mood : this.baseline.mood,
      history: this.history
    };
  }
}

if (require.main === module) {
  const harness = new SelfModelHarness();
  harness.recordCycle(1, { success: true });
  harness.recordCycle(2, { success: false });
  harness.recordCycle(3, { success: false });
  console.log(JSON.stringify(harness.getTrajectorySummary(), null, 2));
}

module.exports = SelfModelHarness;
