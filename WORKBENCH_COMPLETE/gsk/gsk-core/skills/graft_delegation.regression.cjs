'use strict';
/**
 * Regression test — graft_delegation verifyHandoff fail-closed (F5).
 *
 * Field test (Oct 2026) found: a brief whose acceptance.contains was a
 * STRING (not an array) had its contains check silently skipped —
 * verifyHandoff could return verified:true for a handoff that never
 * ran the check, on a brief that executed the wrong goal entirely.
 *
 * This test pins the fix:
 *   1. string-form contains  -> verified:false + a failed
 *      'acceptance_shape' check naming the malformed acceptance.
 *   2. array-form contains + pltCheck, correct result -> verified:true
 *      (the happy path still works — the field-test brief shape).
 *   3. array-form contains, needle missing -> verified:false via the
 *      contains check itself (normal path unbroken).
 *
 * Run: node graft_delegation.regression.cjs   (exit 0 = pass)
 */
const assert = require('assert');
const { _verifyHandoff } = require('./graft_delegation.js');

const GOOD_RESULT = {
    executionStatus: 'executed',
    output: 'Delegated computation finished. TRUE_VALUE=0.7',
};

// 1. Malformed (string) contains must fail closed.
{
    const v = _verifyHandoff({
        acceptance: { contains: 'TRUE_VALUE=0.7', pltCheck: { profit: 0.6, love: 0.3, tax: 0.2 } },
        result: GOOD_RESULT,
    });
    assert.strictEqual(v.verified, false, 'string-form contains must NOT verify');
    const shape = v.checks.find(c => c.name === 'acceptance_shape');
    assert.ok(shape, 'an acceptance_shape check must be recorded');
    assert.strictEqual(shape.ok, false, 'acceptance_shape check must be failed');
    assert.match(shape.detail, /malformed acceptance/, 'detail must name the malformed acceptance');
    assert.match(shape.detail, /contains must be an array/, 'detail must state the required shape');
    console.log('PASS 1: string-form contains fails closed with the malformed-acceptance note');
}

// 2. Array-form happy path (field-test brief shape) still verifies.
{
    const v = _verifyHandoff({
        acceptance: { contains: ['TRUE_VALUE=0.7'], pltCheck: { profit: 0.6, love: 0.3, tax: 0.2 } },
        result: GOOD_RESULT,
    });
    assert.strictEqual(v.verified, true, `array-form happy path must verify (checks: ${JSON.stringify(v.checks)})`);
    console.log('PASS 2: array-form contains + pltCheck verifies a correct handoff');
}

// 3. Array-form with a missing needle fails via the contains check.
{
    const v = _verifyHandoff({
        acceptance: { contains: ['TRUE_VALUE=9.9'] },
        result: GOOD_RESULT,
    });
    assert.strictEqual(v.verified, false, 'missing needle must not verify');
    assert.ok(v.checks.some(c => c.name.startsWith('contains:') && c.ok === false), 'the contains check itself must be the failure');
    assert.ok(!v.checks.some(c => c.name === 'acceptance_shape'), 'well-formed acceptance must not raise acceptance_shape');
    console.log('PASS 3: array-form contains with a missing needle fails on the contains check');
}

console.log('graft_delegation regression: ALL PASS');
