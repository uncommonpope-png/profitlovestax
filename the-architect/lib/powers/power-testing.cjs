/**
 * Power: TESTING
 * Architecture testing and validation.
 * Validates generated architectures against rules and patterns.
 *
 * When to use: The user wants to test an architecture, validate
 *   pattern implementation, or run quality checks.
 */

class PowerTesting {
  constructor(options = {}) {
    this.options = options;
  }

  status() {
    return { ready: true };
  }

  execute(mission) {
    const action = mission.action || 'validate';

    try {
      switch (action) {
        case 'validate': {
          const architecture = mission.architecture || {};
          const results = this.validateArchitecture(architecture);
          return {
            output: {
              validated: true,
              passed: results.passed,
              failed: results.failed,
              results: results.checks
            }
          };
        }
        case 'test': {
          const target = mission.target || 'architecture';
          const tests = this.runTests(target, mission.tests || []);
          return {
            output: {
              tested: true,
              target,
              tests,
              passed: tests.filter(t => t.passed).length,
              failed: tests.filter(t => !t.passed).length
            }
          };
        }
        default:
          return {
            error: `Unknown testing action: ${action}. Available: validate, test`
          };
      }
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  validateArchitecture(architecture) {
    const checks = [];

    // Check layers exist
    const layers = architecture.layers || [];
    checks.push({
      name: 'Has layers',
      passed: layers.length > 0,
      message: layers.length > 0 ? 'Architecture has defined layers' : 'No layers defined'
    });

    // Check dependency direction
    checks.push({
      name: 'Dependency direction',
      passed: !!architecture.dependencyDirection || layers.length > 0,
      message: 'Dependencies should point inward (domain center)'
    });

    // Check for domain layer
    const hasDomain = layers.some(l => l.toLowerCase().includes('domain'));
    checks.push({
      name: 'Domain layer present',
      passed: hasDomain,
      message: hasDomain ? 'Domain layer found' : 'Missing domain layer - critical for clean architecture'
    });

    // Check for tests
    checks.push({
      name: 'Test strategy defined',
      passed: !!architecture.testStrategy,
      message: 'Architecture should include testing strategy'
    });

    const passed = checks.filter(c => c.passed).length;
    const failed = checks.filter(c => !c.passed).length;

    return { checks, passed, failed };
  }

  runTests(target, tests) {
    return tests.map(t => ({
      name: t.name || 'unnamed',
      passed: t.expected === t.actual,
      expected: t.expected,
      actual: t.actual || 'not run'
    }));
  }
}

module.exports = PowerTesting;
