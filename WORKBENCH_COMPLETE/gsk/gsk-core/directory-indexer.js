const fs = require('fs');
const path = require('path');

function indexDir(dirPath) {
  let results = [];
  const list = fs.readdirSync(dirPath);
  list.forEach(file => {
    if (file === 'node_modules' || file.startsWith('.')) return;
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(indexDir(fullPath));
    } else {
      results.push({ path: fullPath, size: stat.size, mtime: stat.mtime });
    }
  });
  return results;
}

const rootDir = path.resolve(__dirname, '..');
const indexData = indexDir(rootDir);
const outputDir = path.resolve(rootDir, 'data');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'directory-index.json'), JSON.stringify(indexData, null, 2));
console.log(`Indexed ${indexData.length} files successfully.`);
