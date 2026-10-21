const ConsciousnessBenchmarkSuite = require('./gsk-core/consciousness_benchmark_suite.js');
const suite = new ConsciousnessBenchmarkSuite();
const mockStates = [
  { mood: 'awakened', valence: 0.50, cycle: 0 },
  { mood: 'heavy', valence: 0.25, cycle: 1 },
  { mood: 'heavy', valence: 0.00, cycle: 2 },
  { mood: 'transformed', valence: 0.09, cycle: 3 }
];
const results = suite.runTemporalEmergenceSuite(mockStates);
console.log(JSON.stringify(results, null, 2));
