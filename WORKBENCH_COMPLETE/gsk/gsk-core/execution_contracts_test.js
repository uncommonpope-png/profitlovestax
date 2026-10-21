const assert = require('assert');
const { ProvenanceDedupEngine } = require('./provenance_dedup_engine');

function runTests() {
  const engine = new ProvenanceDedupEngine({ defaultTTL: 1000 });
  engine.addFailurePattern('TIMEOUT', 'Retry with exponential backoff');
  assert.strictEqual(engine.getMitigation({ error: 'TIMEOUT' }), 'Retry with exponential backoff');
  console.log('Execution contract assertions verified successfully.');
}
if (require.main === module) runTests();
module.exports = { runTests };