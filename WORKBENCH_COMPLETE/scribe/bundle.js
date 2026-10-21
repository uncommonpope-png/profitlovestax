const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'lib', 'soul-scribe.js');
const dest = path.join(__dirname, 'lib', 'soul-scribe.min.js');

let code = fs.readFileSync(src, 'utf8');

// Strip the CLI handler (everything after module.exports)
code = code.replace(/\nif \(require\.main === module\)[\s\S]*$/, '');

// Keep only module.exports = ScribeSoul;
code = code.replace(/^module\.exports = ScribeSoul;/m, '');

// Minify: remove comments, extra whitespace
code = code.replace(/\/\/.*$/gm, '');
code = code.replace(/\/\*[\s\S]*?\*\//g, '');
code = code.replace(/\n{3,}/g, '\n\n');
code = code.replace(/^\s+/gm, '');

// Add export for launcher
const output = `#!/usr/bin/env node
'use strict';
/* SCRIBE v1.0.0 - Protected Core */
${code}
module.exports = { ScribeSoul };
`;

fs.writeFileSync(dest, output);
console.log('Bundle: ' + dest + ' (' + output.length + ' bytes)');
console.log('Original: ' + code.length + ' bytes minified');
