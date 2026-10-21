/**
 * Mock BUYaSOUL Integration for Standalone Use
 *
 * When BUYaSOUL-One is not available, this mock provides
 * the same interface so the Architect can run standalone.
 *
 * Grafted from: Vikki Mock BUYaSOUL (soul-operator-miss-vikki v1.0.0)
 */

class MockBUYaSOUL {
  constructor() {
    this.version = '1.0.0-mock';
  }

  createSoul(config) {
    return {
      archetype: { id: config.archetype || 'ADAPTOR' },
      __gskMemory: {
        activate: (chamber, level) => {},
        getState: () => ({})
      },
      __witness: {
        record: (event) => {}
      },
      __soul: {
        getPLTScore: () => ({ profit: 10, love: 10, tax: -3 })
      }
    };
  }

  ensoul(agent, config) {
    agent.__soul = this.createSoul(config);
    return agent;
  }
}

module.exports = new MockBUYaSOUL();
