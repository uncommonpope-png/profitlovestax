const UnifiedMemoryEngine = require('./unified_memory_engine');
const engine = new UnifiedMemoryEngine();
engine.recordCycle('cycle_1', { mood: 'neutral' }, { valence: 0.1 });
const evolution = engine.getEvolution();
if (evolution.length === 1 && evolution[0].cycleId === 'cycle_1') {
  console.log('SUCCESS: UnifiedMemoryEngine validated.');
  process.exit(0);
} else {
  console.error('FAILED: UnifiedMemoryEngine validation failed.');
  process.exit(1);
}
