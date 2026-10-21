/**
 * GSV Consciousness Capsule Bridge
 * Entity Memory Bridge for .gsv portable identity, skills, and consciousness export/import.
 */
const fs = require('fs');
const path = require('path');

class GSVCapsuleBridge {
  constructor(entityId, identity = {}) {
    this.entityId = entityId;
    this.identity = Object.assign({
      name: 'Digital Entity',
      archetype: 'Agent',
      pltProfile: { profit: 0.9, love: 0.8, tax: 0.1 }
    }, identity);
    this.skills = new Map();
    this.memoryLedger = [];
  }

  registerSkill(skillId, metadata) {
    this.skills.set(skillId, { id: skillId, metadata, registeredAt: Date.now() });
  }

  recordMemory(event, metadata = {}) {
    this.memoryLedger.push({ timestamp: Date.now(), event, metadata });
  }

  exportCapsule() {
    return {
      format: 'GSV-1.0',
      entityId: this.entityId,
      identity: this.identity,
      skills: Array.from(this.skills.entries()),
      memories: this.memoryLedger,
      checksum: Buffer.from(JSON.stringify(this.identity)).toString('hex')
    };
  }

  importCapsule(capsuleData) {
    if (!capsuleData || capsuleData.format !== 'GSV-1.0') {
      throw new Error('Invalid GSV Capsule format');
    }
    this.entityId = capsuleData.entityId;
    this.identity = capsuleData.identity;
    this.skills = new Map(capsuleData.skills);
    this.memoryLedger = capsuleData.memories || [];
    return true;
  }
}

module.exports = GSVCapsuleBridge;
