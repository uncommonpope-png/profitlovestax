/**
 * Power: SYSTEM-DECOMPOSER
 * Breaks complex systems into subsystems, maps dependencies, and creates phased plans.
 * Wraps the ArchitectDecomposer.
 *
 * When to use: The user describes a large system and needs it broken into
 *   manageable, architecturally sound pieces.
 */

const ArchitectDecomposer = require('../architect-decomposer.cjs');

class PowerSystemDecomposer {
  constructor(options = {}) {
    this.decomposer = new ArchitectDecomposer(options);
  }

  status() {
    return {
      ready: true,
      patternMatchers: Object.keys(this.decomposer.patternMatchers || {})
    };
  }

  execute(mission) {
    const description = mission.description || mission.system || 'Generic system';

    try {
      const result = this.decomposer.decompose(description);
      return {
        output: {
          systemType: result.systemType,
          pattern: result.pattern,
          subsystems: result.subsystems,
          dependencies: result.dependencies,
          phases: result.phases,
          estimates: result.estimates,
          criticalPath: result.criticalPath,
          recommendations: result.recommendations
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

module.exports = PowerSystemDecomposer;
