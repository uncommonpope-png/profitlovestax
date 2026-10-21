const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ImmutableStateSerializer {
  constructor(storageDir = path.join(__dirname, '../data')) {
    this.storageDir = storageDir;
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  computeHash(dataStr) {
    return crypto.createHash('sha256').update(dataStr).digest('hex');
  }

  serialize(state) {
    const payload = JSON.stringify(state);
    const hash = this.computeHash(payload);
    const record = { timestamp: Date.now(), hash, payload: state };
    const filePath = path.join(this.storageDir, `state_fallback_${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
    return { filePath, hash, record };
  }

  verifyAndLoad(filePath) {
    if (!fs.existsSync(filePath)) throw new Error('State file not found');
    const raw = fs.readFileSync(filePath, 'utf8');
    const record = JSON.parse(raw);
    const expectedHash = this.computeHash(JSON.stringify(record.payload));
    if (record.hash !== expectedHash) {
      throw new Error('State verification failed: checksum mismatch');
    }
    return record.payload;
  }
}

module.exports = ImmutableStateSerializer;
