/**
 * Power: PATTERN-FORGE
 * The Architect's primary weapon — generates architecture from patterns.
 * Wraps hexagonal, DDD, and CQRS generators.
 *
 * When to use: The user wants code scaffolding, architecture generation,
 *   or pattern-based system design.
 */

const HexagonalGenerator = require('../../src/generators/hexagonal-generator.cjs');
const DDDGenerator = require('../../src/generators/ddd-generator.cjs');
const CQRSGenerator = require('../../src/generators/cqrs-generator.cjs');

class PowerPatternForge {
  constructor(options = {}) {
    this.generators = {
      hexagonal: new HexagonalGenerator(options.hexagonal),
      ddd: new DDDGenerator(options.ddd),
      cqrs: new CQRSGenerator(options.cqrs)
    };
  }

  status() {
    return {
      ready: true,
      generators: Object.keys(this.generators)
    };
  }

  execute(mission) {
    const type = mission.type || mission.pattern || 'hexagonal';
    const config = mission.config || mission;

    try {
      const generator = this.generators[type];
      if (!generator) {
        return {
          error: `Unknown pattern: ${type}. Available: ${Object.keys(this.generators).join(', ')}`
        };
      }

      const result = generator.generate(config);
      return {
        output: {
          pattern: type,
          filesGenerated: result.files?.length || 0,
          structure: result.structure,
          nextSteps: result.nextSteps,
          files: result.files?.map(f => ({ path: f.path, size: f.content?.length || 0 }))
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

module.exports = PowerPatternForge;
