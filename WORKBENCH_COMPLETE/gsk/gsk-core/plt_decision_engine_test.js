const PLTDecisionEngine = require('./plt_decision_engine');
const engine = new PLTDecisionEngine();
const testCases = [
  { name: 'High Value Action', telemetry: { profit: 0.9, love: 0.8, tax: 0.1 }, expected: true },
  { name: 'High Tax Penalty', telemetry: { profit: 0.1, love: 0.1, tax: 0.9 }, expected: false }
];
let passed = 0;
testCases.forEach(tc => {
  const res = engine.evaluateAction(tc.telemetry);
  if (res.approved === tc.expected) {
    console.log(`[PASS] ${tc.name}: score=${res.score.toFixed(3)} approved=${res.approved}`);
    passed++;
  } else {
    console.error(`[FAIL] ${tc.name}: expected ${tc.expected}, got ${res.approved}`);
  }
});
if (passed === testCases.length) {
  console.log('ALL PLT ENGINE TESTS PASSED.');
  process.exit(0);
} else {
  process.exit(1);
}
