const fs = require('fs');
const path = require('path');

class MultiAgentHarness {
  constructor(config = {}) {
    this.agents = new Map();
    this.composers = new Map();
    this.name = config.name || 'MultiAgentHarness';
  }

  registerAgent(id, agentFn) {
    this.agents.set(id, agentFn);
  }

  registerComposer(id, composeFn) {
    this.composers.set(id, composeFn);
  }

  async executeStep(agentId, input) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    return await agent(input);
  }

  async inlineCompose(composerId, stepResults) {
    const composer = this.composers.get(composerId);
    if (!composer) throw new Error(`Composer ${composerId} not found`);
    return await composer(stepResults);
  }
}

module.exports = { MultiAgentHarness };
