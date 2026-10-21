/**
 * Incremental Chunk-Based Harness
 * Prevents single-pass truncation failures by managing multi-chunk output composition.
 */
class ChunkHarness {
  constructor(options = {}) {
    this.maxChunkSize = options.maxChunkSize || 4000;
    this.chunks = [];
    this.status = 'initialized';
  }

  addChunk(chunk) {
    if (typeof chunk !== 'string') throw new Error('Chunk must be a string');
    if (chunk.length > this.maxChunkSize) {
      console.warn('Chunk exceeds maximum recommended size:', chunk.length);
    }
    this.chunks.push(chunk);
    return this.chunks.length;
  }

  assemble() {
    const fullOutput = this.chunks.join('');
    this.status = 'assembled';
    return fullOutput;
  }

  verifyIntegrity(expectedPattern) {
    const content = this.assemble();
    if (expectedPattern && !content.includes(expectedPattern)) {
      return { valid: false, reason: 'Expected pattern missing' };
    }
    return { valid: true, size: content.length, chunksCount: this.chunks.length };
  }
}

module.exports = { ChunkHarness };
