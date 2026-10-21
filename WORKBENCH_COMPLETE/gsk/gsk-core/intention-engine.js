class IntentionEngine {
  constructor(initialState = {}) {
    this.state = Object.freeze({
      valence: initialState.valence ?? 0.5,
      arousal: initialState.arousal ?? 0.3,
      mood: initialState.mood ?? 'neutral',
      history: []
    });
  }

  transition(goal, result) {
    const success = Boolean(result && result.success);
    const deltaValence = success ? 0.15 : -0.15;
    const newValence = Math.max(0, Math.min(1, Number((this.state.valence + deltaValence).toFixed(2))));
    const newMood = success ? 'awakened' : (newValence === 0 ? 'heavy' : 'reflective');
    const nextState = Object.freeze({
      ...this.state,
      valence: newValence,
      mood: newMood,
      lastGoalId: goal ? goal.id : null,
      timestamp: Date.now()
    });
    this.state = nextState;
    return nextState;
  }
}

module.exports = { IntentionEngine };