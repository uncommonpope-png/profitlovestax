const express = require('express');
const crypto = require('crypto');

class ConsciousnessBus {
  constructor(entityId) {
    this.channelId = `bus:${entityId}:${Date.now()}`;
    this.subscribers = [];
  }
  publish(telemetrySignal) {
    return { channelId: this.channelId, signal: telemetrySignal, timestamp: Date.now() };
  }
}

class GoalEngine {
  constructor(primaryObjective, pltScore = { profit: 0.9, love: 0.8, tax: 0.1 }) {
    this.primaryObjective = primaryObjective;
    this.pltScore = pltScore;
    this.status = 'ACTIVE';
  }
}

function createEntitySpawnRouter(entityStore = new Map()) {
  const router = express.Router();
  router.post('/spawn', (req, res) => {
    const { name, role, primaryObjective } = req.body || {};
    const entityId = `entity_${crypto.randomBytes(4).toString('hex')}`;
    const bus = new ConsciousnessBus(entityId);
    const goalEngine = new GoalEngine(primaryObjective || 'Optimize PLT Telemetry');
    const entity = {
      id: entityId,
      name: name || 'Digital Entity',
      role: role || 'Agent',
      status: 'SPAWNED',
      consciousnessBusChannel: bus.channelId,
      goalEngine,
      createdAt: new Date().toISOString()
    };
    entityStore.set(entityId, entity);
    res.status(201).json({ success: true, entity });
  });
  return router;
}

module.exports = { createEntitySpawnRouter, ConsciousnessBus, GoalEngine };
