/**
 * Chunked Streaming Generator Utility
 * Decomposes monolithic synthesis routines into scaffold -> append-chunk iterations
 * to prevent token truncation, buffer overflow, and cycle deadlocks.
 */
const fs = require('fs');
const path = require('path');

class ChunkedGeneratorStream {
  constructor(outputPath, maxChunkBytes = 3500) {
    this.outputPath = path.resolve(outputPath);
    this.maxChunkBytes = maxChunkBytes;
    this.chunksWritten = 0;
  }

  scaffold(initialSkeleton) {
    fs.mkdirSync(path.dirname(this.outputPath), { recursive: true });
    fs.writeFileSync(this.outputPath, initialSkeleton, 'utf8');
    this.chunksWritten = 1;
    return { status: 'scaffolded', path: this.outputPath };
  }

  appendChunk(chunkContent) {
    if (Buffer.byteLength(chunkContent, 'utf8') > this.maxChunkBytes) {
      throw new Error(`Chunk size exceeds max safety threshold of ${this.maxChunkBytes} bytes`);
    }
    fs.appendFileSync(this.outputPath, chunkContent, 'utf8');
    this.chunksWritten++;
    return { status: 'appended', chunkIndex: this.chunksWritten };
  }

  finalize(closingStructure = '') {
    if (closingStructure) {
      fs.appendFileSync(this.outputPath, closingStructure, 'utf8');
    }
    return { status: 'completed', totalChunks: this.chunksWritten, path: this.outputPath };
  }
}

module.exports = ChunkedGeneratorStream;

if (require.main === module) {
  const demoPath = path.join(__dirname, '../data/test_chunk_output.html');
  const stream = new ChunkedGeneratorStream(demoPath);
  stream.scaffold('<!DOCTYPE html><html><head><title>Chunk Stream Test</title></head><body>\n<div id="app">');
  stream.appendChunk('<h1>Chunked Streaming Active</h1>\n<p>Preventing token truncation and deadlocks.</p>');
  const result = stream.finalize('</div></body></html>');
  console.log('Stream test result:', JSON.stringify(result));
}
