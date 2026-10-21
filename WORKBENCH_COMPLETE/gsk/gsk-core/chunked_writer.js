/**
 * Chunked File Writer & Verification Utility
 */
const fs = require('fs');
const path = require('path');

class ChunkedFileWriter {
  constructor(filePath, maxChunkSize = 4000) {
    this.filePath = path.resolve(filePath);
    this.maxChunkSize = maxChunkSize;
  }

  scaffold(initialContent) {
    if (initialContent.length > this.maxChunkSize) {
      throw new Error(`Initial content exceeds max chunk size of ${this.maxChunkSize}`);
    }
    fs.writeFileSync(this.filePath, initialContent, 'utf8');
    return true;
  }
}

  appendChunk(chunkContent) {
    if (chunkContent.length > this.maxChunkSize) {
      throw new Error(`Chunk size ${chunkContent.length} exceeds limit ${this.maxChunkSize}`);
    }
    fs.appendFileSync(this.filePath, chunkContent, 'utf8');
    return true;
  }

  verifyIntegrity(expectedEnding) {
    const content = fs.readFileSync(this.filePath, 'utf8');
    if (expectedEnding && !content.trim().endsWith(expectedEnding)) {
      return { valid: false, reason: `Missing expected ending: ${expectedEnding}` };
    }
    return { valid: true, length: content.length };
  }
}

module.exports = ChunkedFileWriter;
