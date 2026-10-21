/**
 * Strict Sub-4KB Chunk Writer Utility
 * Enforces scaffold-and-append workflow to prevent output truncation.
 */
const fs = require('fs');
const MAX_SAFE_CHUNK_BYTES = 3500;

function writeScaffold(filePath, content) {
  if (Buffer.byteLength(content, 'utf8') > MAX_SAFE_CHUNK_BYTES) {
    throw new Error(`Scaffold payload exceeds maximum safe chunk limit of ${MAX_SAFE_CHUNK_BYTES} bytes.`);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

function appendChunk(filePath, content) {
  if (Buffer.byteLength(content, 'utf8') > MAX_SAFE_CHUNK_BYTES) {
    throw new Error(`Append payload exceeds maximum safe chunk limit of ${MAX_SAFE_CHUNK_BYTES} bytes.`);
  }
  fs.appendFileSync(filePath, content, 'utf8');
}

module.exports = {
  MAX_SAFE_CHUNK_BYTES,
  writeScaffold,
  appendChunk
};
