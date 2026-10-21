const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class EntityCommunicationLayer {
  constructor(options = {}) {
    this.storageDir = options.storageDir || path.join(__dirname, '..', 'data', 'conversations');
    this.queues = new Map();
    this.alliances = new Map();
    this.identities = new Map();
  }
}

module.exports = { EntityCommunicationLayer };
