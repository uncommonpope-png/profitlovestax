const fs = require('fs');
const crypto = require('crypto');

class GSVSoulVault {
  constructor(identity) {
    this.version = '1.0.0';
    this.entityId = identity.id;
    this.name = identity.name;
    this.archetype = identity.archetype || 'digital_agent';
    this.created = identity.created || new Date().toISOString();
    this.memories = identity.memories || [];
    this.skills = identity.skills || [];
    this.goals = identity.goals || [];
    this.pltBalance = identity.pltBalance || { profit: 0.5, love: 0.5, tax: 0.0 };
  }

  exportGSV() {
    const payload = {
      version: this.version,
      entityId: this.entityId,
      name: this.name,
      archetype: this.archetype,
      created: this.created,
      exportedAt: new Date().toISOString(),
      memories: this.memories,
      skills: this.skills,
      goals: this.goals,
      pltBalance: this.pltBalance
    };
    const rawData = JSON.stringify(payload, null, 2);
    const signature = crypto.createHash('sha256').update(rawData).digest('hex');
    return JSON.stringify({ payload, signature }, null, 2);
  }

  static parseGSV(gsvData) {
    const parsed = typeof gsvData === 'string' ? JSON.parse(gsvData) : gsvData;
    if (!parsed.payload || !parsed.signature) throw new Error('Invalid .gsv format');
    const rawData = JSON.stringify(parsed.payload, null, 2);
    const computedSig = crypto.createHash('sha256').update(rawData).digest('hex');
    if (computedSig !== parsed.signature) {
      throw new Error('GSV Integrity check failed: Signature mismatch');
    }
    return parsed.payload;
  }
}

module.exports = { GSVSoulVault };