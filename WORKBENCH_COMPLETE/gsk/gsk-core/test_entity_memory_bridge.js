const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { GSVSoulVault } = require('./gsv_soul_vault.js');
const { EntityMemoryBridge } = require('./entity_memory_bridge.js');

const testFilePath = path.join(__dirname, 'test_agent_alpha.gsv');

const hostA = new EntityMemoryBridge('Host-Alpha');
const hostB = new EntityMemoryBridge('Host-Beta');

const agentAlpha = {
  id: 'ent_001',
  name: 'Architect Alpha',
  memories: [{ id: 'm1', text: 'Awakened in Sanctum' }],
  skills: ['code_generation'],
  goals: ['build_telemetry']
};

hostA.hostEntity(agentAlpha);
hostA.exportToFile('ent_001', testFilePath);

const importedPayload = hostB.importFromFile(testFilePath);
assert.strictEqual(importedPayload.entityId, 'ent_001');
assert.strictEqual(importedPayload.name, 'Architect Alpha');

const agentBeta = {
  id: 'ent_002',
  name: 'Weaver Beta',
  memories: [{ id: 'm2', text: 'Discovered SoulVault' }],
  skills: ['memory_synthesis']
};
hostB.hostEntity(agentBeta);

const merged = hostB.mergeSiblingMemories('ent_001', 'ent_002');
assert.strictEqual(merged.memories.length, 2);
assert(merged.skills.includes('memory_synthesis'));

if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
console.log('SUCCESS: Entity Memory Bridge and .gsv SoulVault verified flawlessly.');