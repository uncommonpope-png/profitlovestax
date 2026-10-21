'use strict';

/**
 * SemanticMemory — RECONSTRUCTION (built 2026-10-20, surgery op 1).
 *
 * The original src/memory/semantic_memory.js existed only on the author's
 * Desktop SCRIBE install; it is absent from every repo (GitHub code search:
 * "class SemanticMemory" = 0 hits across uncommonpope-png). This minimal
 * in-memory implementation satisfies the exact interface used by
 * workbench/profit-brain/body/scribe-module.js:
 *   new SemanticMemory()
 *   semanticMemory.size            — number of stored entries
 *   await semanticMemory.store(content, { weight })
 * Retrieval is simple token-overlap ranking (no embeddings dependency).
 */

class SemanticMemory {
  constructor() {
    this.entries = [];
  }

  get size() {
    return this.entries.length;
  }

  async store(content, meta = {}) {
    const entry = {
      id: `sem_${Date.now().toString(36)}_${this.entries.length}`,
      content: String(content || ''),
      weight: typeof meta.weight === 'number' ? meta.weight : 0.5,
      storedAt: new Date().toISOString(),
    };
    if (entry.content.length > 0) this.entries.push(entry);
    return entry;
  }

  async search(query, limit = 5) {
    const terms = String(query || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
    if (terms.length === 0) return [];
    return this.entries
      .map((e) => {
        const hay = e.content.toLowerCase();
        const hits = terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
        return { entry: e, score: hits / terms.length };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.entry.weight - a.entry.weight)
      .slice(0, limit)
      .map((r) => ({ ...r.entry, score: r.score }));
  }
}

module.exports = { SemanticMemory };
