class ActiveInferenceEngine {
  constructor(config = {}) {
    this.priorPreferences = config.priorPreferences || { profit: 1.0, love: 1.0, tax: 0.0 };
    this.stateBeliefs = config.stateBeliefs || { profit: 0.5, love: 0.5, tax: 0.2 };
    this.learningRate = config.learningRate || 0.1;
  }

  calculatePLTValue(state) {
    return (state.profit || 0) + (state.love || 0) - (state.tax || 0);
  }

  calculateVariationalFreeEnergy(observation, belief) {
    const errorProfit = Math.pow(observation.profit - belief.profit, 2);
    const errorLove = Math.pow(observation.love - belief.love, 2);
    const errorTax = Math.pow(observation.tax - belief.tax, 2);
    return 0.5 * (errorProfit + errorLove + errorTax);
  }

  calculateExpectedFreeEnergy(action, currentBelief) {
    const predictedState = {
      profit: currentBelief.profit + (action.deltaProfit || 0),
      love: currentBelief.love + (action.deltaLove || 0),
      tax: currentBelief.tax + (action.deltaTax || 0)
    };
    const pltScore = this.calculatePLTValue(predictedState);
    const epistemicValue = Math.log(1 + Math.abs(action.uncertainty || 0.1));
    const pragmaticValue = pltScore;
    return -(pragmaticValue + epistemicValue);
  }

  step(observation) {
    const vfe = this.calculateVariationalFreeEnergy(observation, this.stateBeliefs);
    this.stateBeliefs.profit += this.learningRate * (observation.profit - this.stateBeliefs.profit);
    this.stateBeliefs.love += this.learningRate * (observation.love - this.stateBeliefs.love);
    this.stateBeliefs.tax += this.learningRate * (observation.tax - this.stateBeliefs.tax);

    const candidateActions = [
      { name: 'EXPAND_PROFIT', deltaProfit: 2.0, deltaLove: 0.5, deltaTax: 0.5, uncertainty: 0.2 },
      { name: 'NURTURE_LOVE', deltaProfit: 0.5, deltaLove: 2.0, deltaTax: 0.2, uncertainty: 0.1 },
      { name: 'REDUCE_TAX', deltaProfit: 0.2, deltaLove: 0.2, deltaTax: -1.5, uncertainty: 0.15 }
    ];

    let bestAction = candidateActions[0];
    let minEFE = Infinity;

    for (const action of candidateActions) {
      const efe = this.calculateExpectedFreeEnergy(action, this.stateBeliefs);
      if (efe < minEFE) {
        minEFE = efe;
        bestAction = action;
      }
    }

    return {
      vfe,
      selectedAction: bestAction,
      expectedFreeEnergy: minEFE,
      updatedBeliefs: { ...this.stateBeliefs },
      pltValue: this.calculatePLTValue(this.stateBeliefs)
    };
  }
}

module.exports = { ActiveInferenceEngine };
