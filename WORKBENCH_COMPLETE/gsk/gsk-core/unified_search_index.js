const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const outputPath = path.join(dataDir, 'unified_index.json');

function buildIndex() {
  const index = {
    timestamp: Date.now(),
    files: [],
    todos: [],
    traits: []
  };
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item === 'node_modules' || item.startsWith('.')) continue;
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        scanDir(full);
      } else if (stat.isFile()) {
        const rel = path.relative(rootDir, full);
        index.files.push({ path: rel, size: stat.size, mtime: stat.mtimeMs });
      }
    }
  }
  scanDir(path.join(rootDir, 'gsk-core'));
  scanDir(dataDir);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log('Unified index generated successfully at', outputPath);
}
buildIndex();
