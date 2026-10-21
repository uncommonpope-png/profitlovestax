/**
 * Power: DESIGN-SWARM
 * Multi-agent system design. Orchestrates specialized architecture agents
 * that design subsystems in parallel.
 *
 * When to use: The user wants a complete system designed by a team of
 *   specialized architecture agents working together.
 */

const ArchitectSwarm = require('../architect-swarm.cjs');

class PowerDesignSwarm {
  constructor(options = {}) {
    this.swarm = new ArchitectSwarm(options);
    this.swarm.initializeDefaultSwarm();
  }

  status() {
    return {
      ready: true,
      agents: this.swarm.getSwarmStatus()
    };
  }

  async execute(mission) {
    const systemConfig = mission.system || mission.config || { name: 'Untitled System' };

    try {
      const result = await this.swarm.designSystem(systemConfig);
      return {
        output: {
          system: result.system,
          strategy: result.strategy,
          subsystems: result.subsystems,
          dependencyGraph: result.dependencyGraph,
          integrationPoints: result.integrationPoints,
          recommendations: result.recommendations,
          nextSteps: result.nextSteps
        }
      };
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}

module.exports = PowerDesignSwarm;
