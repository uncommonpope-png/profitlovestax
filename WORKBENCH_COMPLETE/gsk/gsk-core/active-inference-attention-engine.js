/**
 * Active Inference Attention Engine
 * Prioritizes high PLT (Profit + Love - Tax) value streams using dynamic precision weighting
 * and variational free energy minimization principles.
 */
class ActiveInferenceAttentionEngine {
  constructor(config = {}) {
    this.precisionFloor = config.precisionFloor || 0.01;
    this.decayFactor = config.decayFactor || 0.95;
    this.beliefs = new Map();
  }

  calculatePLT(stream) {
    const profit = stream.profit || 0;
    const love = stream.love || 0;
    const tax = stream.tax || 0;
    return profit + love - tax;
  }

  evaluateStream(stream) {
    const trueValue = this.calculatePLT(stream);
    const prior = this.beliefs.get(stream.id) || { expectedValue: trueValue, precision: 1.0 };
    
    // Prediction error (Surprise)
    const predictionError = Math.abs(trueValue - prior.expectedValue);
    
    // Update precision based on prediction error and past performance
    const updatedPrecision = Math.max(
      this.precisionFloor,
      prior.precision * this.decayFactor + (1 / (1 + predictionError))
    );
    
    // Free Energy calculation: -Value + Weighted Error Penalty
    const freeEnergy = -trueValue + (predictionError * (1 / updatedPrecision));
    
    // Attention allocation score combines high PLT value and precision confidence
    const attentionScore = trueValue * updatedPrecision;

    // Update internal belief state
    this.beliefs.set(stream.id, {
      expectedValue: prior.expectedValue * 0.7 + trueValue * 0.3,
      precision: updatedPrecision,
      lastScore: attentionScore
    });

    return {
      id: stream.id,
      pltValue: trueValue,
      predictionError,
      precision: updatedPrecision,
      freeEnergy,
      attentionScore
    };
  }

  prioritizeStreams(streams) {
    if (!Array.isArray(streams)) return [];
    const evaluated = streams.map(s => this.evaluateStream(s));
    return evaluated.sort((a, b) => b.attentionScore - a.attentionScore);
  }
}

module.exports = { ActiveInferenceAttentionEngine };
