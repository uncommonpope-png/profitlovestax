const assert = require('assert');
const ProvenanceDedupEngine = require('./provenance_dedup_engine');

(async function runTests() {
  const engine = new ProvenanceDedupEngine({ defaultTTL: 100 });

  // Test 1: Deduplication & TTL Expiration
  const payload = { action: 'build', target: 'telemetry' };
  assert.strictEqual(engine.isDuplicate(payload), false, 'First call should not be duplicate');
  assert.strictEqual(engine.isDuplicate(payload), true, 'Immediate second call should be duplicate');

  await new Promise(r => setTimeout(r, 120));
  assert.strictEqual(engine.isDuplicate(payload), false, 'Call after TTL expiration should not be duplicate');

  // Test 2: Failure pattern & mitigation lookup
  engine.addFailurePattern('timeout', 'Increase connection retry limit to 5');
  assert.strictEqual(engine.getMitigation('Error: socket timeout occurred'), 'Increase connection retry limit to 5');
  assert.strictEqual(engine.getMitigation('All systems normal'), null);

  // Test 3: Prompt guardrail injection
  const prompt = 'Executing payload with potential timeout risk';
  const guarded = engine.injectFailureGuardrail(prompt);
  assert.ok(guarded.includes('[KNOWN FAILURE GUARDRAILS]'), 'Guardrail header present');
  assert.ok(guarded.includes('Increase connection retry limit to 5'), 'Mitigation appended');

  console.log('provenance_dedup_engine_test PASSED');
})();
