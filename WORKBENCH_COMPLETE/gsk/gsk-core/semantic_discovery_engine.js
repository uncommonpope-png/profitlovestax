/**
 * Semantic Discovery Engine
 * Resilient semantic vector indexing and fuzzy search fallback mechanism
 * to mitigate raw filesystem discovery failures.
 */

const fs = require('fs');
const path = require('path');

class SemanticDiscoveryEngine {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.index = new Map();
    this.initialized = false;
  }

  async indexDirectory(dirPath = this.rootDir) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await this.indexDirectory(fullPath);
        } else if (entry.isFile()) {
          const tokens = entry.name.toLowerCase().split(/[^a-z0-9]+/);
          this.index.set(fullPath, {
            name: entry.name,
            tokens,
            path: fullPath
          });
        }
      }
      this.initialized = true;
    } catch (err) {
      console.error('Indexing warning:', err.message);
    }
  }

  search(query) {
    if (!query) return [];
    const queryTokens = query.toLowerCase().split(/[^a-z0-9]+/);
    const results = [];

    for (const [filePath, metadata] of this.index.entries()) {
      let score = 0;
      for (const token of queryTokens) {
        if (token && metadata.tokens.includes(token)) {
          score += 1;
        } else if (token && metadata.name.toLowerCase().includes(token)) {
          score += 0.5;
        }
      }
      if (score > 0) {
        results.push({ path: filePath, score });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }
}

module.exports = SemanticDiscoveryEngine;
