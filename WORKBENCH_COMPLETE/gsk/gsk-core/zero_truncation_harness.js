class ZeroTruncationHarness {
  constructor(options = {}) {
    this.maxChunkSize = options.maxChunkSize || 4000;
    this.buffer = [];
  }
  appendChunk(chunk) {
    this.buffer.push(chunk);
  }
  getCompleteOutput() {
    return this.buffer.join('');
  }
  isTruncated(responseStr) {
    if (!responseStr || typeof responseStr !== 'string') return false;
    const trimmed = responseStr.trim();
    return !trimmed.endsWith('}') && !trimmed.endsWith(']') && !trimmed.endsWith('</html>');
  }
}
module.exports = { ZeroTruncationHarness };
