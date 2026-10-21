/**
 * Pure Functional Intention Engine
 * Maps agent desires/intentions to valid state transitions strictly deterministically.
 */

const VALID_TRANSITIONS = {
  idle: ['evaluating', 'sleeping'],
  evaluating: ['acting', 'idle', 'grieving'],
  acting: ['evaluating', 'idle', 'awakening'],
  grieving: ['evaluating', 'idle'],
  awakening: ['idle', 'evaluating']
};

/**
 * Maps a desire and current agent state to a candidate next state.
 * @param {Object} state - Current agent state { mood, valence, arousal, stage }
 * @param {Object} desire - Agent desire { type, targetState, payload }
 * @returns {Object} Transition result { valid: boolean, newState: Object, reason: string }
 */
function mapDesireToTransition(state, desire) {
  if (!state || !state.stage) {
    return { valid: false, newState: state, reason: 'Invalid initial state' };
  }
  
  const allowed = VALID_TRANSITIONS[state.stage] || [];
  const target = desire.targetState;
  
  if (!allowed.includes(target)) {
    return {
      valid: false,
      newState: state,
      reason: `Transition from ${state.stage} to ${target} is invalid` 
    };
  }
  
  // Calculate pure next state values based on desire payload
  const deltaValence = desire.payload?.deltaValence || 0;
  const deltaArousal = desire.payload?.deltaArousal || 0;
  
  const newValence = Math.max(-1, Math.min(1, (state.valence || 0) + deltaValence));
  const newArousal = Math.max(0, Math.min(1, (state.arousal || 0) + deltaArousal));
  
  return {
    valid: true,
    newState: {
      ...state,
      stage: target,
      valence: Number(newValence.toFixed(2)),
      arousal: Number(newArousal.toFixed(2)),
      lastTransition: Date.now()
    },
    reason: `Successfully transitioned to ${target}`
  };
}

module.exports = {
  mapDesireToTransition,
  VALID_TRANSITIONS
};
