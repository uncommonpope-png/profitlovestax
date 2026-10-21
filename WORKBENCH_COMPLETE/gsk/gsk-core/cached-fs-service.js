const fs = require('fs');
const path = require('path');

class CachedFilesystemService {
  constructor(ttlMs = 5000) {
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  async readFile(filePath) {
    const now = Date.now();
    if (this.cache.has(filePath)) {
      const entry = this.cache.get(filePath);
      if (now - entry.timestamp < this.ttlMs) {
        return entry.data;
      }
    }
    const data = await fs.promises.readFile(filePath, 'utf8');
    this.cache.set(filePath, { data, timestamp: now });
    return data;
  }

  invalidate(filePath) {
    if (filePath) {
      this.cache.delete(filePath);
    } else {
      this.cache.clear();
    }
  }
}

module.exports = CachedFilesystemService;
