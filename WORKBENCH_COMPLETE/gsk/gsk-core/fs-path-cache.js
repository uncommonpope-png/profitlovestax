'use strict';

const fs = require('fs');
const path = require('path');

class FSPathCache {
  constructor(ttlMs = 300000) {
    this.pathCache = new Map();
    this.dirCache = new Map();
    this.genesisIngested = false;
    this.ttlMs = ttlMs;
  }

  isValidPath(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') return false;
    const normalized = path.normalize(targetPath);
    const now = Date.now();
    if (this.pathCache.has(normalized)) {
      const cached = this.pathCache.get(normalized);
      if (now - cached.timestamp < this.ttlMs) {
        return cached.exists;
      }
    }
    const exists = fs.existsSync(normalized);
    this.pathCache.set(normalized, { exists, timestamp: now });
    return exists;
  }

  listValidDir(dirPath) {
    const normalized = path.normalize(dirPath);
    if (!this.isValidPath(normalized)) return [];
    const now = Date.now();
    if (this.dirCache.has(normalized)) {
      const cached = this.dirCache.get(normalized);
      if (now - cached.timestamp < this.ttlMs) {
        return cached.files;
      }
    }
    try {
      const files = fs.readdirSync(normalized);
      this.dirCache.set(normalized, { files, timestamp: now });
      return files;
    } catch (err) {
      this.pathCache.set(normalized, { exists: false, timestamp: now });
      return [];
    }
  }

  isGenesisIngested() {
    return this.genesisIngested;
  }

  markGenesisIngested() {
    this.genesisIngested = true;
  }

  invalidate(targetPath) {
    if (!targetPath) {
      this.pathCache.clear();
      this.dirCache.clear();
      return;
    }
    const normalized = path.normalize(targetPath);
    this.pathCache.delete(normalized);
    this.dirCache.delete(normalized);
  }
}

module.exports = new FSPathCache();
