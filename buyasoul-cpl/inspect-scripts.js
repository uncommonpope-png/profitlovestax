const fs = require('fs');
const acorn = require('acorn');

// Root-level JS files
const rootFiles = fs.readdirSync('.').filter(f => f.endsWith('.js'));
let failed = [];
rootFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    try {
        acorn.parse(content, { ecmaVersion: 2022, sourceType: 'module' });
    } catch (e) {
        failed.push(f + ': ' + e.message + ' @ ' + e.loc.line + ':' + e.loc.column);
    }
});
console.log('Root JS files failed:');
if (failed.length) failed.forEach(x => console.log('  ' + x));
else console.log('  (none)');

// Check index.html script tags
const html = fs.readFileSync('index.html', 'utf8');
const tags = html.match(/<script[^>]*>/g) || [];
console.log('\nScript tag count: ' + tags.length);
const withSrc = tags.filter(t => t.includes('src='));
console.log('Script tags with src: ' + withSrc.length);

// Show all script tags so we can see type attributes
const seen = {};
withSrc.forEach(t => {
    const srcMatch = t.match(/src="([^"]+)"/);
    const src = srcMatch ? srcMatch[1] : '?';
    const isModule = t.includes('type="module"');
    if (!seen[src + (isModule ? ' (module)' : '')]) {
        seen[src + (isModule ? ' (module)' : '')] = true;
        console.log('  [' + (isModule ? 'MODULE' : 'CLASSIC') + '] ' + src);
    }
});
