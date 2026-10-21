const ConsciousnessPLTModel = require('./consciousness_plt_model');

const model = new ConsciousnessPLTModel(0.5, 0.3);
console.log('Cycle 0 (Awakening Baseline):', model.calculateTemporalPLT());

model.updateState(-0.43, -0.15);
console.log('Cycle 1 (Heavy Valence Decay):', model.calculateTemporalPLT());

model.updateState(0.50, 0.20);
console.log('Cycle 2 (Goal Completion Transformation):', model.calculateTemporalPLT());
