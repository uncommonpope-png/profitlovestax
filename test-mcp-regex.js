/**
 * TDD TEST — mcp_server regex extraction
 * Gun: tdd_workflow_enforcer
 * Run: node test-mcp-regex.js
 */
const assert = require('assert');

// ── Minimal _extractJsonObject (same logic as mcp_server.js:1623) ──
function extractJsonObject(text) {
    if (!text) return null;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') {
            let depth = 0, inStr = false, escaped = false;
            for (let j = i; j < text.length; j++) {
                const ch = text[j];
                if (inStr) { if (escaped) { escaped = false; continue; } if (ch === '\\') { escaped = true; continue; } if (ch === '"') inStr = false; continue; }
                if (ch === '"') { inStr = true; continue; }
                if (ch === '{') depth++;
                else if (ch === '}') { depth--; if (depth === 0) { const c = text.slice(i, j + 1); if (/^\{\s*"(?:tool|name|path|command|action|function)"/.test(c)) return { 1: c }; break; } }
            }
        }
    }
    return null;
}

// ── Test data ──
// CRITICAL: nested braces in the MIDDLE of the JSON string value — this is the real bug case
const nestedJSON = JSON.stringify({
    tool: 'edit_file',
    args: {
        path: 'C:\\\\test.js',
        new_string: 'function greet() {\n  return {msg: "hello"};\n}\nfunction farewell() {\n  return "bye";\n}'
    }
});

const simpleJSON = JSON.stringify({
    tool: 'write_file',
    args: { path: 'hello.txt', content: 'hello world' }
});

const tagBlock = '<tool_call>\n' + nestedJSON + '\n</tool_call>';
const simpleTagBlock = '<tool_call>\n' + simpleJSON + '\n</tool_call>';
const plainText = simpleJSON;

// ── TEST 1: Simple JSON — should work ──
console.log('TEST 1: Simple JSON extraction...');
{
    const m = simpleTagBlock.match(/<tool_call>\s*(\{.*?\})\s*<\/tool_call>/is);
    assert(m, 'regex matched');
    JSON.parse(m[1].trim());
    console.log('  PASS');
}

// ── TEST 2: Nested braces — regex truncates (THE BUG) ──
console.log('TEST 2: Nested-brace JSON — regex truncation (BUG)...');
{
    const m = tagBlock.match(/<tool_call>\s*(\{.*?\})\s*<\/tool_call>/is);
    if (m) {
        try {
            JSON.parse(m[1].trim());
            console.log('  Regex happened to work (nested brace at end)');
        } catch (e) {
            console.log('  CONFIRMED BUG — regex captured truncated JSON');
            console.log('  Error: ' + e.message);
        }
    } else {
        console.log('  PASS — regex did not match at all');
    }
}

// ── TEST 3: Balanced-brace extraction — should PASS ──
console.log('TEST 3: Balanced-brace extraction...');
{
    const r = extractJsonObject(tagBlock);
    assert(r, 'extracted');
    const p = JSON.parse(r[1]);
    assert.strictEqual(p.tool, 'edit_file');
    assert(p.args.new_string.includes('return {msg'), 'nested braces preserved');
    console.log('  PASS');
}

// ── TEST 4: Integrated fix (full-tag capture + balanced extract) ──
console.log('TEST 4: Integrated fix (full-tag + balanced)...');
{
    const m = tagBlock.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/is);
    assert(m, 'full-tag matched');
    const r = extractJsonObject(m[1].trim());
    assert(r, 'extracted');
    const p = JSON.parse(r[1]);
    assert.strictEqual(p.tool, 'edit_file');
    assert(p.args.new_string.includes('function greet()'), 'code intact');
    console.log('  PASS');
}

// ── TEST 5: Plain JSON without tags ──
console.log('TEST 5: Plain JSON fallback...');
{
    const r = extractJsonObject(plainText);
    assert(r, 'extracted');
    JSON.parse(r[1]);
    console.log('  PASS');
}

console.log('\n=== ALL 5 TESTS PASSED ===');
