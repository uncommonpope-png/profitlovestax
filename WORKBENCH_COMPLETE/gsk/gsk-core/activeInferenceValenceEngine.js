class ActiveInferenceValenceEngine {
  constructor(config = {}) {
    this.baselineValence = config.baselineValence || 0.0;
    this.currentValence = this.baselineValence;
    this.arousal = config.arousal || 0.5;
  }

  computeExpectedFreeEnergy(policy, targetState) {
    const profitWeight = Math.max(0.1, 0.5 + this.currentValence * 0.4);
    const loveWeight = Math.max(0.1, 0.4 + this.currentValence * 0.3);
    const taxWeight = Math.max(0.1, 0.5 - this.currentValence * 0.4);
    const epistemicValue = (1 - Math.abs(this.currentValence)) * 0.5;
    const pragmaticValue = policy.profit * profitWeight + policy.love * loveWeight - policy.tax * taxWeight;
    return -(pragmaticValue + epistemicValue);
  }

  evaluatePolicies(policies, targetState) {
    return policies.map(policy => ({
      policy,
      efe: this.computeExpectedFreeEnergy(policy, targetState),
      pltScore: policy.profit + policy.love - policy.tax
    })).sort((a, b) => a.efe - b.efe);
  }

  updateValence(outcomeSuccess, deltaValence = 0.1) {
    if (outcomeSuccess) {
      this.currentValence = Math.min(1.0, this.currentValence + deltaValence);
    } else {
      this.currentValence = Math.max(-1.0, this.currentValence - deltaValence);
    }
    return this.currentValence;
  }
}

module.exports = { ActiveInferenceValenceEngine };
