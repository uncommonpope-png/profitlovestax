const fs = require('fs');
const path = require('path');

class GSVMemoryCapsule {
  constructor(identity = {}, skills = [], memoryStream = [], pltBalance = { profit: 1.0, love: 1.0, tax: 0.1 }) {
    this.version = '1.0.0';
    this.gsvHeader = 'GSV-CAPSULE-v1';
    this.createdAt = new Date().toISOString();
    this.identity = {
      id: identity.id || `entity-${Date.now()}`,
      name: identity.name || 'Unnamed Soul',
      archetype: identity.archetype || 'Seeker',
      signature: identity.signature || 'FINGERPRINT_UNSIGNED',
      ...identity
    };
    this.skills = skills;
    this.memoryStream = memoryStream;
    this.pltBalance = pltBalance;
  }

  exportGSV() {
    return JSON.stringify({
      header: this.gsvHeader,
      version: this.version,
      createdAt: this.createdAt,
      identity: this.identity,
      skills: this.skills,
      memoryStream: this.memoryStream,
      pltBalance: this.pltBalance,
      checksum: Buffer.from(JSON.stringify(this.identity)).toString('base64')
    }, null, 2);
  }

  static importGSV(gsvDataString) {
    const data = JSON.parse(gsvDataString);
    if (data.header !== 'GSV-CAPSULE-v1') {
      throw new Error('Invalid .gsv capsule format');
    }
    return new GSVMemoryCapsule(data.identity, data.skills, data.memoryStream, data.pltBalance);
  }
}

module.exports = { GSVMemoryCapsule };
