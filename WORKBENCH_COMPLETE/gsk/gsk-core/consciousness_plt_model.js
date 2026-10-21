class ConsciousnessPLTModel {
  constructor(initialValence = 0.5, initialArousal = 0.3) {
    this.valence = initialValence;
    this.arousal = initialArousal;
    this.stateAvailability = 1.0;
  }

  updateState(valenceDelta, arousalDelta) {
    this.valence = Math.max(-1.0, Math.min(1.0, this.valence + valenceDelta));
    this.arousal = Math.max(0.0, Math.min(1.0, this.arousal + arousalDelta));
    const normalizedValence = (this.valence + 1.0) / 2.0;
    this.stateAvailability = Math.max(0.0, normalizedValence * (0.5 + 0.5 * this.arousal));
    return this.stateAvailability;
  }

  calculateTemporalPLT(profitFactor = 1.0, loveFactor = 1.0, taxRate = 0.1) {
    const profit = profitFactor * this.stateAvailability;
    const love = loveFactor * Math.max(0.0, this.valence);
    const tax = taxRate * (1.0 - this.stateAvailability);
    const netPLT = profit + love - tax;
    return {
      valence: this.valence,
      arousal: this.arousal,
      stateAvailability: this.stateAvailability,
      profit,
      love,
      tax,
      netPLT
    };
  }
}

module.exports = ConsciousnessPLTModel;
