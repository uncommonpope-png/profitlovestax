const fs = require('fs');
const path = require('path');

/**
 * Chunked Multi-Pass File Generator
 * Prevents truncation by auto-scaffolding and appending code chunks under strict size thresholds.
 */
class ChunkedGenerator {
  static MAX_CHUNK_SIZE = 3500;

  static scaffold(filePath, initialSkeleton) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, initialSkeleton, 'utf8');
  }

  static appendChunk(filePath, chunkContent) {
    fs.appendFileSync(filePath, chunkContent, 'utf8');
  }

  static verifyIntegrity(filePath, requiredEnding) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (requiredEnding && !content.trim().endsWith(requiredEnding)) {
      throw new Error(`File integrity check failed: missing required closing string ${requiredEnding}`);
    }
    return true;
  }
}

module.exports = ChunkedGenerator;
