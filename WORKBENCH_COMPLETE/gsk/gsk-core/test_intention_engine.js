const { mapDesireToTransition } = require('./intention_engine');
const assert = require('assert');

// Test 1: Valid transition from idle to evaluating
const state1 = { stage: 'idle', valence: 0.5, arousal: 0.3 };
const desire1 = { targetState: 'evaluating', payload: { deltaValence: 0.1 } };
const result1 = mapDesireToTransition(state1, desire1);
assert.strictEqual(result1.valid, true);
assert.strictEqual(result1.newState.stage, 'evaluating');
assert.strictEqual(result1.newState.valence, 0.6);

// Test 2: Invalid transition from idle to acting
const desire2 = { targetState: 'acting' };
const result2 = mapDesireToTransition(state1, desire2);
assert.strictEqual(result2.valid, false);
assert.strictEqual(result2.newState.stage, 'idle');

console.log('All intention engine unit tests passed successfully!');
