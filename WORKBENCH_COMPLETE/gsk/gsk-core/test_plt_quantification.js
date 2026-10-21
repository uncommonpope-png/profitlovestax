const PLTQuantificationEngine = require('./plt_quantification_engine');
const engine = new PLTQuantificationEngine();

const sampleState = {
  valence: 0.25,
  arousal: 0.4,
  freeEnergyDecayRate: 0.15,
  goalCompletions: 2,
  failureCount: 1
};

const result = engine.calculatePLT(sampleState);
console.log('Quantification Test Result:', JSON.stringify(result, null, 2));
if (typeof result.trueValue === 'number' && !isNaN(result.trueValue)) {
  console.log('PLT Quantification Engine verification PASSED');
} else {
  throw new Error('PLT Quantification Engine verification FAILED');
}
