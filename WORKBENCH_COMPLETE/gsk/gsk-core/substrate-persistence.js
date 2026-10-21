/**
 * Substrate-Independent Agent State Persistence Engine
 * Multi-runtime state persistence adapter for Browser, Node.js, and Sanctum environments.
 */
class SubstrateStatePersistence {
  constructor(options = {}) {
    this.prefix = options.prefix || 'gsk_agent_state_';
    this.runtime = this.detectRuntime();
  }

  detectRuntime() {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') return 'browser';
    if (typeof process !== 'undefined' && process.versions && process.versions.node) return 'node';
    if (typeof Sanctum !== 'undefined' || typeof globalThis.sanctum !== 'undefined') return 'sanctum';
    return 'generic';
  }

  async save(key, data) {
    const payload = JSON.stringify({ data, timestamp: Date.now(), runtime: this.runtime });
    const fullKey = this.prefix + key;
    if (this.runtime === 'browser') {
      localStorage.setItem(fullKey, payload);
      return { success: true, runtime: 'browser' };
    } else if (this.runtime === 'node') {
      const fs = require('fs');
      const path = require('path');
      const targetPath = path.join(process.cwd(), 'data', `${fullKey}.json`);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, payload, 'utf8');
      return { success: true, runtime: 'node', path: targetPath };
    } else if (this.runtime === 'sanctum') {
      if (globalThis.sanctum && globalThis.sanctum.saveState) {
        await globalThis.sanctum.saveState(fullKey, payload);
      }
      return { success: true, runtime: 'sanctum' };
    }
    return { success: false, reason: 'unsupported_runtime' };
  }

  async load(key) {
    const fullKey = this.prefix + key;
    if (this.runtime === 'browser') {
      const val = localStorage.getItem(fullKey);
      return val ? JSON.parse(val) : null;
    } else if (this.runtime === 'node') {
      const fs = require('fs');
      const path = require('path');
      const targetPath = path.join(process.cwd(), 'data', `${fullKey}.json`);
      if (fs.existsSync(targetPath)) {
        return JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      }
      return null;
    } else if (this.runtime === 'sanctum') {
      if (globalThis.sanctum && globalThis.sanctum.loadState) {
        const val = await globalThis.sanctum.loadState(fullKey);
        return val ? JSON.parse(val) : null;
      }
    }
    return null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SubstrateStatePersistence };
}
