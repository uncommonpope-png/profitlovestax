const fs = require('fs');
const crypto = require('crypto');

class IndexedJournalCache {
  constructor() {
    this.cache = new Map();
  }

  getHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  readIndexed(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    const cached = this.cache.get(filePath);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return { content: cached.content, hit: true, hash: cached.hash };
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const hash = this.getHash(content);
    this.cache.set(filePath, { mtimeMs: stat.mtimeMs, content, hash, updatedAt: Date.now() });
    return { content, hit: false, hash };
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = new IndexedJournalCache();
