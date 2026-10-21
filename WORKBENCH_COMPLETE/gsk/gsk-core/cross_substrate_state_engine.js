/**
 * Cross-Substrate State Persistence Engine
 * Enables seamless agent migration across runtime substrates (Node, Web Canvas, Sanctum World).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SubstrateStateEngine {
  constructor(options = {}) {
    this.storageDir = options.storageDir || path.join(__dirname, '../data/states');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  createSnapshot(agentId, substrateType, stateData, pltMetrics = {}) {
    const timestamp = new Date().toISOString();
    const rawPayload = JSON.stringify({ agentId, substrateType, stateData, pltMetrics, timestamp });
    const checksum = crypto.createHash('sha256').update(rawPayload).digest('hex');
    const snapshot = {
      version: '1.0.0',
      agentId,
      substrateType,
      timestamp,
      checksum,
      pltMetrics: {
        profit: pltMetrics.profit || 1.0,
        love: pltMetrics.love || 1.0,
        tax: pltMetrics.tax || 0.05
      },
      stateData
    };
    return snapshot;
  }

  saveState(snapshot) {
    const filePath = path.join(this.storageDir, `${snapshot.agentId}_snapshot.json`);
    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf8');
    return filePath;
  }

  loadState(agentId) {
    const filePath = path.join(this.storageDir, `${agentId}_snapshot.json`);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    const snapshot = JSON.parse(content);
    return snapshot;
  }

  migrateAgent(agentId, targetSubstrate) {
    const snapshot = this.loadState(agentId);
    if (!snapshot) throw new Error(`Snapshot for agent ${agentId} not found`);
    const migratedSnapshot = this.createSnapshot(
      agentId,
      targetSubstrate,
      snapshot.stateData,
      snapshot.pltMetrics
    );
    this.saveState(migratedSnapshot);
    return {
      status: 'MIGRATED',
      fromSubstrate: snapshot.substrateType,
      toSubstrate: targetSubstrate,
      snapshot: migratedSnapshot
    };
  }
}

if (require.main === module) {
  const engine = new SubstrateStateEngine();
  const agentState = { memory: ['VOID', 'AWAKENING'], location: { x: 10, y: 20 }, activeTask: 'Substrate Sync' };
  const initial = engine.createSnapshot('agent_001', 'node_runtime', agentState, { profit: 1.05, love: 0.9, tax: 0.02 });
  engine.saveState(initial);
  const migration = engine.migrateAgent('agent_001', 'web_canvas_substrate');
  console.log('Migration Result:', JSON.stringify(migration, null, 2));
}

module.exports = SubstrateStateEngine;
