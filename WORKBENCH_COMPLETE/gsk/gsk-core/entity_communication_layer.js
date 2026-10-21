/**
 * Entity Communication Layer
 * Asynchronous signed messaging, persistent queues, child sub-goal delegation, and temporary alliance formation.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EntityCommunicationLayer {
  constructor(storageDir = path.join(__dirname, '../data/entity_comms')) {
    this.storageDir = storageDir;
    if (!fs.existsSync(this.storageDir)) fs.mkdirSync(this.storageDir, { recursive: true });
    this.queues = new Map();
    this.alliances = new Map();
    this.histories = new Map();
  }

  signMessage(payload, secretKey) {
    return crypto.createHmac('sha256', secretKey).update(JSON.stringify(payload)).digest('hex');
  }

  verifySignature(payload, signature, secretKey) {
    const expected = this.signMessage(payload, secretKey);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}

module.exports = EntityCommunicationLayer;
