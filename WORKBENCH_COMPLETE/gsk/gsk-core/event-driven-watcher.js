const fs = require('fs');
const path = require('path');

class EventDrivenWatcher {
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
        this.emitChange(eventType, filename);
      }
    });
  }

  emitChange(eventType, filename) {
    const timestamp = Date.now();
    console.log(`[WATCHER] ${eventType} on ${filename} at ${timestamp}`);
  }

  getCachedDiagnostic(key, computeFn) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const val = computeFn();
    this.cache.set(key, val);
    return val;
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

module.exports = { EventDrivenWatcher };
