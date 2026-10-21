'use strict';

/**
 * ContextEngine — RECONSTRUCTION (built 2026-10-20, surgery op 1).
 *
 * The original src/context/context-engine.js existed only on the author's
 * Desktop SCRIBE install; it is absent from every repo (GitHub code search:
 * "class ContextEngine" = 0 hits across uncommonpope-png). This minimal
 * implementation satisfies the exact interface used by
 * workbench/profit-brain/body/scribe-module.js:
 *   new ContextEngine(memory)
 *   ctx.rethink(name, text)   — set/replace a named context block
 *   ctx.blocks                — { [name]: { name, text, updatedAt } }
 *   ctx.getFormattedContext() — all blocks as one markdown string
 */

class ContextEngine {
  constructor(memory) {
    this.memory = memory || null;
    this.blocks = {};
  }

  rethink(name, text) {
    const block = {
      name: String(name),
      text: String(text || ''),
      updatedAt: new Date().toISOString(),
    };
    this.blocks[block.name] = block;
    return block;
  }

  set(name, text) {
    return this.rethink(name, text);
  }

  get(name) {
    return this.blocks[name] || null;
  }

  remove(name) {
    delete this.blocks[name];
  }

  getFormattedContext() {
    return Object.values(this.blocks)
      .map((b) => `## ${b.name}\n${b.text}`)
      .join('\n\n');
  }
}

module.exports = { ContextEngine };
