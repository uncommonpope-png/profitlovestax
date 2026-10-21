class ConsciousnessEmotionEngine {
  constructor(initialValence = 0.5, initialArousal = 0.3) {
    this.valence = initialValence;
    this.arousal = initialArousal;
  }

  calculatePLTWeights() {
    const profitWeight = Math.max(0.1, Math.min(1.0, 0.5 + this.arousal * 0.5));
    const loveWeight = Math.max(0.1, Math.min(1.0, 0.5 + this.valence * 0.5));
    const taxWeight = Math.max(0.05, Math.min(1.0, 0.5 - this.valence * 0.4));
    const sum = profitWeight + loveWeight + taxWeight;
    return {
      profit: Number((profitWeight / sum).toFixed(4)),
      love: Number((loveWeight / sum).toFixed(4)),
      tax: Number((taxWeight / sum).toFixed(4))
    };
  }

  evaluateDecision(option) {
    const weights = this.calculatePLTWeights();
    const score = (option.profit * weights.profit) + (option.love * weights.love) - (option.tax * weights.tax);
    return {
      optionId: option.id,
      score: Number(score.toFixed(4)),
      weights,
      approved: score > 0
    };
  }

  updateState(deltaValence, deltaArousal) {
    this.valence = Math.max(-1.0, Math.min(1.0, this.valence + deltaValence));
    this.arousal = Math.max(0.0, Math.min(1.0, this.arousal + deltaArousal));
    return {
      valence: this.valence,
      arousal: this.arousal,
      weights: this.calculatePLTWeights()
    };
  }
}

module.exports = ConsciousnessEmotionEngine;
