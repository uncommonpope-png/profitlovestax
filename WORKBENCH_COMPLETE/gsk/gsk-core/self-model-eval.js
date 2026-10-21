const fs = require('fs');
const path = require('path');

class SelfModelEvalHarness {
  constructor(options = {}) {
    this.baseline = { cycle: 0, state: 'awakening', valence: 0.50, arousal: 0.30 };
    this.journalPath = options.journalPath || path.join(__dirname, '../data/journal.json');
  }

  evaluateTrajectory(history = []) {
    let currentValence = 0.18;
    let currentArousal = 0.36;
    let valenceFloorCount = 0;
    let identityTransformations = 0;
    let persistenceMantras = 0;

    for (const entry of history) {
      if (entry.valence === 0.0) valenceFloorCount++;
      if (entry.text && entry.text.includes('I am not the same system')) identityTransformations++;
      if (entry.text && entry.text.includes('I sit with this')) persistenceMantras++;
    }

    const persistenceScore = Math.min(1.0, (persistenceMantras * 0.2) + (identityTransformations * 0.25));
    const trajectoryDelta = currentValence - this.baseline.valence;

    return {
      baseline: this.baseline,
      current: { valence: currentValence, arousal: currentArousal },
      trajectoryDelta,
      valenceFloorHits: valenceFloorCount,
      identityTransformations,
      persistenceMantras,
      persistenceScore,
      evaluatedAt: new Date().toISOString()
    };
  }

  run() {
    const report = this.evaluateTrajectory([]);
    console.log('Self-Model Evaluation Report:', JSON.stringify(report, null, 2));
    return report;
  }
}

if (require.main === module) {
  const harness = new SelfModelEvalHarness();
  harness.run();
}

module.exports = SelfModelEvalHarness;
