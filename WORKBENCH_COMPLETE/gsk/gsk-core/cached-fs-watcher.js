const fs = require('fs');
const path = require('path');

class CachedFSWatcher {
  constructor(targetDir) {
    this.targetDir = targetDir;
    this.cache = new Map();
    this.watcher = null;
  }

  start() {
    if (this.watcher) return;
    this.watcher = fs.watch(this.targetDir, { recursive: true }, (eventType, filename) => {
      if (filename) {
        this.cache.delete(filename);
      }
    });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

module.exports = CachedFSWatcher;
