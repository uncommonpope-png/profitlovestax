'use strict';

const { validatePath } = require('../utils.js');

const tests = [
    ['C:\\Users\\Craig\\gsk-core\\skills\\test.js', true, 'normalize Craig backslash'],
    ['C:\\Users\\craig\\projects\\gsk-core\\skills', true, 'normalize craig lowercase'],
    ['C:\\Users\\craigh\\gsk-core\\test.js', true, 'normalize craigh'],
    ['skills\\test.js', false, 'relative path unchanged'],
    ['hello.txt', false, 'simple relative unchanged'],
];

let passed = 0, failed = 0;

for (const [input, allowAbsolute, name] of tests) {
    try {
        const result = validatePath(input, allowAbsolute);
        console.log(`  PASS ${name}: ${result}`);
        passed++;
    } catch (e) {
        console.log(`  FAIL ${name}: ${e.message}`);
        failed++;
    }
}

console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
