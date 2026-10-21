const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = 'https://raw.githubusercontent.com/uncommonpope-png/final-run/master';
const files = [
  'package.json', 'SOUL.md', 'README.md',
  'src/identity.js', 'src/voice/voice.js',
  'src/bridge/bridge.js', 'src/memory/memory.js',
  'src/chambers/reader.js', 'src/chambers/definitions.js',
  'src/skills/engine.js', 'src/skills/web_fetch.js',
  'src/skills/file_read.js', 'src/skills/file_write.js',
  'src/skills/bash_run.js', 'src/skills/git_ops.js',
  'src/skills/search.js', 'src/skills/github_api.js'
];

function fetch(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function main() {
  for (const f of files) {
    const url = BASE + '/' + f;
    const dest = path.join(__dirname, f);
    try {
      await fetch(url, dest);
      console.log('OK', f);
    } catch (e) {
      console.log('FAIL', f, e.message);
    }
  }
}
main().catch(console.error);
