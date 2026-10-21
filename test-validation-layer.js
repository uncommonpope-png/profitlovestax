/**
 * TDD TEST — Validation Layer stage 2: schema validation
 * Gun: validation_layer + tdd_workflow_enforcer
 * Run: node test-validation-layer.js
 */
const assert = require('assert');

// ── The validation function under test (same logic to be added to mcp_server.js) ──
function validateToolCall(toolName, args, schemas) {
    const entry = schemas.find(s => s.function?.name === toolName);
    if (!entry) return { ok: false, reason: `Tool ${toolName} not found.` };
    const schema = entry.function.parameters || {};
    const required = schema.required || [];
    const props = schema.properties || {};
    const errors = [];
    for (const key of required) {
        if (!(key in args) || args[key] === undefined || args[key] === null || args[key] === '') {
            errors.push(`missing required key: ${key}`);
        }
    }
    for (const [key, prop] of Object.entries(props)) {
        if (!(key in args)) continue;
        if (prop.type === 'string' && typeof args[key] !== 'string') {
            errors.push(`${key} must be string, got ${typeof args[key]}`);
        }
    }
    if (errors.length) return { ok: false, reason: 'Schema errors: ' + errors.join('; ') };
    return { ok: true };
}

// ── Test schemas (mirrors brain_manager.js defaultNativeTools shape) ──
const schemas = [
    {
        type: 'function',
        function: {
            name: 'write_file',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string' },
                    content: { type: 'string' },
                },
                required: ['path', 'content'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'read_file',
            parameters: {
                type: 'object',
                properties: { path: { type: 'string' } },
                required: ['path'],
            },
        },
    },
];

// ── TEST 1: Valid call passes ──
console.log('TEST 1: valid call passes...');
{
    const r = validateToolCall('write_file', { path: 'C:/a.txt', content: 'hello' }, schemas);
    assert.strictEqual(r.ok, true, 'should pass');
    console.log('  PASS');
}

// ── TEST 2: Missing required key fails ──
console.log('TEST 2: missing required key fails...');
{
    const r = validateToolCall('write_file', { path: 'C:/a.txt' }, schemas);
    assert.strictEqual(r.ok, false, 'should fail');
    assert(r.reason.includes('content'), 'error mentions content');
    console.log('  PASS');
}

// ── TEST 3: Unknown tool fails ──
console.log('TEST 3: unknown tool fails...');
{
    const r = validateToolCall('delete_c:/windows', {}, schemas);
    assert.strictEqual(r.ok, false, 'should fail');
    assert(r.reason.includes('not found'), 'error mentions not found');
    console.log('  PASS');
}

// ── TEST 4: Wrong type fails ──
console.log('TEST 4: wrong type fails...');
{
    const r = validateToolCall('read_file', { path: 12345 }, schemas);
    assert.strictEqual(r.ok, false, 'should fail');
    assert(r.reason.includes('path must be string'), 'error mentions type');
    console.log('  PASS');
}

// ── TEST 5: Empty required arg fails (empty string treated as missing) ──
console.log('TEST 5: empty required arg fails...');
{
    const r = validateToolCall('read_file', { path: '' }, schemas);
    assert.strictEqual(r.ok, false, 'should fail');
    console.log('  PASS');
}

console.log('\n=== ALL 5 TESTS PASSED — validation function is correct ===');
