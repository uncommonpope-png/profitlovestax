class EntityLifecycleManager {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://127.0.0.1:3001';
    this.entities = new Map();
  }
  monitorHealth(entityId) {
    const entity = this.entities.get(entityId);
    if (!entity) return { status: 'dead', score: 0 };
    return entity.health;
  }
  spawnEntity(spec) {
    const id = 'entity-' + Date.now();
    const entity = { id, spec, health: { status: 'healthy', score: 1.0 }, state: {} };
    this.entities.set(id, entity);
    return entity;
  }
  executeKnowledgeHandoff(sourceId, targetId) {
    const source = this.entities.get(sourceId);
    const target = this.entities.get(targetId);
    if (source && target) {
      target.state = { ...source.state, handoffTimestamp: Date.now() };
      return true;
    }
    return false;
  }
}
module.exports = EntityLifecycleManager;
