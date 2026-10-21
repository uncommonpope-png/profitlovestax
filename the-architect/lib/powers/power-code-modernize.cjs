/**
 * Power: Code Modernization / Refactoring
 *
 * Analyzes legacy codebases, generates modernization plans,
 * and creates incremental refactoring artifacts using
 * Strangler Fig and Branch by Abstraction patterns.
 *
 * Grafted from:
 * - Modernization patterns: Strangler Fig (Martin Fowler)
 * - Modernization patterns: Branch by Abstraction (Martin Fowler)
 * - jscodeshift / recast patterns (facebook/jscodeshift ~11,000★)
 *
 * What it does:
 * - Scans legacy code for anti-patterns (callbacks, var, jQuery-style, deep nesting)
 * - Generates a phased modernization roadmap
 * - Creates Strangler Fig facade code to incrementally replace modules
 * - Creates Branch by Abstraction layers to swap implementations
 */

const fs = require('fs');
const path = require('path');

class PowerCodeModernize {
  constructor(config = {}) {
    this.config = config;
    this.state = {
      status: 'idle',
      analysesRun: 0,
      plansGenerated: 0,
      stranglerFacadesCreated: 0,
      abstractionsAdded: 0,
      lastAction: null
    };
  }

  /**
   * Execute a modernization mission
   * @param {Object} mission - { action, payload }
   */
  execute(mission) {
    const { action, payload } = mission;
    this.state.status = 'executing';
    this.state.lastAction = action;

    switch (action) {
      case 'analyze':
        return this.analyzeLegacy(payload.codebase, payload.rules);
      case 'plan':
        return this.generatePlan(payload.analysis, payload.outputPath);
      case 'strangler':
        return this.createStrangler(payload.target, payload.replacement, payload.outputPath);
      case 'abstraction':
        return this.addAbstraction(payload.module, payload.implementations, payload.outputPath);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Analyze legacy code for anti-patterns and modernization opportunities
   */
  analyzeLegacy(codebase = {}, rules = []) {
    const findings = [];
    const defaultRules = [
      { id: 'callback-hell', pattern: /function\s*\([^)]*\)\s*\{[\s\S]*?function\s*\(/, severity: 'high', message: 'Nested callbacks detected — convert to async/await' },
      { id: 'var-usage', pattern: /\bvar\b/, severity: 'medium', message: 'var declarations found — convert to let/const' },
      { id: 'no-strict', pattern: /^(?!.*"use strict")/, severity: 'low', message: 'Missing "use strict" directive' },
      { id: 'jquery-ajax', pattern: /\$\.ajax\s*\(/, severity: 'medium', message: 'jQuery $.ajax found — replace with fetch/axios' },
      { id: 'deep-nesting', pattern: /if\s*\([^)]*\)\s*\{[\s\S]*?if\s*\([^)]*\)\s*\{[\s\S]*?if\s*\(/, severity: 'high', message: 'Deep nesting detected — extract functions or use early returns' },
      { id: 'magic-numbers', pattern: /(?<![\w.])\d{3,}(?![\w.])/, severity: 'low', message: 'Magic numbers detected — extract to named constants' },
      { id: 'long-functions', pattern: /function\s*\w*\s*\([^)]*\)\s*\{[\s\S]{1000,}\}/, severity: 'medium', message: 'Long function detected — consider decomposition' },
      { id: 'old-require', pattern: /require\(['"]\.\.\/\.\.\//, severity: 'low', message: 'Deep relative requires — consider path aliases or barrel exports' }
    ];

    const activeRules = rules.length > 0 ? rules : defaultRules;

    Object.entries(codebase).forEach(([fileName, source]) => {
      activeRules.forEach(rule => {
        if (rule.pattern.test(source)) {
          const matches = (source.match(rule.pattern) || []).length;
          findings.push({
            file: fileName,
            ruleId: rule.id,
            severity: rule.severity,
            message: rule.message,
            occurrences: matches
          });
        }
      });
    });

    const summary = {
      filesAnalyzed: Object.keys(codebase).length,
      totalFindings: findings.length,
      bySeverity: { high: 0, medium: 0, low: 0 },
      byRule: {}
    };

    findings.forEach(f => {
      summary.bySeverity[f.severity]++;
      summary.byRule[f.ruleId] = (summary.byRule[f.ruleId] || 0) + f.occurrences;
    });

    this.state.analysesRun++;
    return { summary, findings };
  }

  /**
   * Generate a phased modernization roadmap
   */
  generatePlan(analysis, outputPath) {
    const phases = [];
    const severityOrder = { high: 1, medium: 2, low: 3 };

    // Phase 1: Quick wins (low severity, high volume)
    const quickWins = analysis.findings.filter(f => f.severity === 'low');
    if (quickWins.length > 0) {
      phases.push({
        phase: 1,
        name: 'Quick Wins',
        duration: '1-2 days',
        tasks: [...new Set(quickWins.map(f => f.ruleId))].map(ruleId => ({
          ruleId,
          description: quickWins.find(f => f.ruleId === ruleId)?.message,
          filesAffected: quickWins.filter(f => f.ruleId === ruleId).map(f => f.file)
        }))
      });
    }

    // Phase 2: Medium risk refactors
    const mediumRisk = analysis.findings.filter(f => f.severity === 'medium');
    if (mediumRisk.length > 0) {
      phases.push({
        phase: 2,
        name: 'Standardize Patterns',
        duration: '3-5 days',
        tasks: [...new Set(mediumRisk.map(f => f.ruleId))].map(ruleId => ({
          ruleId,
          description: mediumRisk.find(f => f.ruleId === ruleId)?.message,
          filesAffected: mediumRisk.filter(f => f.ruleId === ruleId).map(f => f.file)
        }))
      });
    }

    // Phase 3: High risk / architectural
    const highRisk = analysis.findings.filter(f => f.severity === 'high');
    if (highRisk.length > 0) {
      phases.push({
        phase: 3,
        name: 'Architectural Modernization',
        duration: '1-2 weeks',
        tasks: [...new Set(highRisk.map(f => f.ruleId))].map(ruleId => ({
          ruleId,
          description: highRisk.find(f => f.ruleId === ruleId)?.message,
          filesAffected: highRisk.filter(f => f.ruleId === ruleId).map(f => f.file),
          pattern: 'strangler-fig'
        }))
      });
    }

    // Phase 4: Testing & validation
    phases.push({
      phase: phases.length + 1,
      name: 'Validate & Harden',
      duration: '2-3 days',
      tasks: [
        { ruleId: 'test-coverage', description: 'Ensure test coverage before and after each phase' },
        { ruleId: 'integration-tests', description: 'Run full integration test suite' },
        { ruleId: 'performance-baseline', description: 'Capture performance baseline and compare' }
      ]
    });

    const totalFiles = new Set(analysis.findings.map(f => f.file)).size;
    const plan = {
      generatedAt: new Date().toISOString(),
      totalPhases: phases.length,
      estimatedDuration: phases.map(p => p.duration).join(' → '),
      filesToModify: totalFiles,
      phases
    };

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(plan, null, 2), 'utf8');
    }

    this.state.plansGenerated++;
    return { plan, outputPath };
  }

  /**
   * Create a Strangler Fig facade for incremental replacement
   */
  createStrangler(target, replacement, outputPath) {
    const pascalTarget = target.charAt(0).toUpperCase() + target.slice(1);
    const pascalReplacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);

    const code = `/**
 * Strangler Fig Facade: ${pascalTarget} → ${pascalReplacement}
 *
 * Pattern: Incrementally replace ${target} with ${replacement}
 * by routing traffic through a feature-flagged facade.
 */

const Legacy${pascalTarget} = require('./${target}.legacy');
const New${pascalReplacement} = require('./${replacement}.new');

class ${pascalTarget}Facade {
  constructor(config = {}) {
    this.useNewImplementation = config.featureFlag || process.env.USE_${replacement.toUpperCase()} === 'true';
    this.legacy = new Legacy${pascalTarget}();
    this.newImpl = new New${pascalReplacement}();
    this.metrics = { legacyCalls: 0, newCalls: 0, errors: 0 };
  }

  async execute(...args) {
    if (this.useNewImplementation) {
      try {
        const result = await this.newImpl.execute(...args);
        this.metrics.newCalls++;
        return result;
      } catch (error) {
        this.metrics.errors++;
        console.warn(\`[Strangler] New implementation failed, falling back to legacy: \${error.message}\`);
        return this.legacy.execute(...args);
      }
    }

    this.metrics.legacyCalls++;
    return this.legacy.execute(...args);
  }

  // Shadow mode: run both and compare results without affecting callers
  async shadowExecute(...args) {
    const legacyResult = await this.legacy.execute(...args);
    let newResult;
    let match = false;

    try {
      newResult = await this.newImpl.execute(...args);
      match = JSON.stringify(legacyResult) === JSON.stringify(newResult);
      if (!match) {
        console.warn('[Strangler] Result mismatch detected:', { legacyResult, newResult });
      }
    } catch (error) {
      console.warn('[Strangler] New implementation error in shadow mode:', error.message);
    }

    return { legacyResult, newResult, match };
  }

  enableNewImplementation() {
    this.useNewImplementation = true;
    console.log('[Strangler] Switched to new implementation:', '${pascalReplacement}');
  }

  disableNewImplementation() {
    this.useNewImplementation = false;
    console.log('[Strangler] Reverted to legacy implementation:', '${pascalTarget}');
  }

  getMetrics() {
    return { ...this.metrics, usingNew: this.useNewImplementation };
  }
}

module.exports = { ${pascalTarget}Facade };
`;

    if (outputPath) {
      fs.writeFileSync(outputPath, code, 'utf8');
    }

    this.state.stranglerFacadesCreated++;
    return { pattern: 'strangler-fig', target, replacement, code, outputPath };
  }

  /**
   * Add a Branch by Abstraction layer to swap implementations
   */
  addAbstraction(moduleName, implementations = [], outputPath) {
    const pascalModule = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

    const implImports = implementations.map((impl, idx) => {
      const name = `${pascalModule}${this._pascalCase(impl)}`;
      return `const ${name} = require('./${moduleName}.${impl}');`;
    }).join('\n');

    const factoryCases = implementations.map((impl, idx) => {
      const name = `${pascalModule}${this._pascalCase(impl)}`;
      return `      case '${impl}':\n        return new ${name}(config);`;
    }).join('\n');

    const interfaceMethods = [
      'async initialize() {',
      '    throw new Error("Method not implemented");',
      '  }',
      '  async execute(input) {',
      '    throw new Error("Method not implemented");',
      '  }',
      '  async shutdown() {',
      '    throw new Error("Method not implemented");',
      '  }'
    ].join('\n  ');

    const code = `/**
 * Branch by Abstraction: ${pascalModule}
 *
 * Pattern: Define an abstraction, then swap implementations
 * without changing callers.
 */

${implImports}

// Abstract interface — all implementations must conform
class ${pascalModule}Abstraction {
  constructor(config = {}) {
    this.config = config;
  }

  ${interfaceMethods}
}

// Factory to select implementation at runtime
function create${pascalModule}(variant = '${implementations[0] || 'default'}', config = {}) {
  switch (variant) {
${factoryCases}
      default:\n        throw new Error(\`Unknown implementation variant: \${variant}\`);
  }\n}

// A/B test router: randomly assign implementations and collect metrics
class ${pascalModule}Experiment {
  constructor(variants = [], config = {}) {
    this.variants = variants; // [{ name: 'legacy', weight: 0.8 }, { name: 'new', weight: 0.2 }]
    this.config = config;
    this.metrics = {};
  }

  async run(input) {
    const selected = this._selectVariant();
    const impl = create${pascalModule}(selected.name, this.config);
    const start = Date.now();

    try {
      await impl.initialize();
      const result = await impl.execute(input);
      await impl.shutdown();

      this._recordMetrics(selected.name, 'success', Date.now() - start);
      return result;
    } catch (error) {
      this._recordMetrics(selected.name, 'error', Date.now() - start);
      throw error;
    }
  }

  _selectVariant() {
    const totalWeight = this.variants.reduce((sum, v) => sum + (v.weight || 1), 0);
    let random = Math.random() * totalWeight;
    for (const variant of this.variants) {
      random -= (variant.weight || 1);
      if (random <= 0) return variant;
    }
    return this.variants[this.variants.length - 1];
  }

  _recordMetrics(variant, outcome, duration) {
    if (!this.metrics[variant]) this.metrics[variant] = { calls: 0, errors: 0, totalDuration: 0 };
    this.metrics[variant].calls++;
    if (outcome === 'error') this.metrics[variant].errors++;
    this.metrics[variant].totalDuration += duration;
  }

  getMetrics() {
    return Object.entries(this.metrics).map(([variant, data]) => ({
      variant,
      calls: data.calls,
      errorRate: data.calls > 0 ? (data.errors / data.calls) : 0,
      avgDuration: data.calls > 0 ? (data.totalDuration / data.calls) : 0
    }));
  }
}

module.exports = { ${pascalModule}Abstraction, create${pascalModule}, ${pascalModule}Experiment };
`;

    if (outputPath) {
      fs.writeFileSync(outputPath, code, 'utf8');
    }

    this.state.abstractionsAdded++;
    return { pattern: 'branch-by-abstraction', module: moduleName, implementations, code, outputPath };
  }

  _pascalCase(str) {
    return str.split(/[-_]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  }

  /**
   * Get current power status
   */
  status() {
    return {
      power: 'CodeModernize',
      status: this.state.status,
      analysesRun: this.state.analysesRun,
      plansGenerated: this.state.plansGenerated,
      stranglerFacadesCreated: this.state.stranglerFacadesCreated,
      abstractionsAdded: this.state.abstractionsAdded,
      lastAction: this.state.lastAction,
      ready: true
    };
  }
}

module.exports = PowerCodeModernize;

// CLI demo
if (require.main === module) {
  const power = new PowerCodeModernize();

  console.log('🔌 Power: Code Modernization');
  console.log('Status:', power.status());
  console.log('');

  // Analyze demo
  const codebase = {
    'legacy-service.js': `
      var data = null;
      function getUser(id, callback) {
        $.ajax({ url: '/api/users/' + id, success: function(res) {
          callback(null, res);
        }, error: function(err) {
          callback(err);
        }});
      }
      function process() {
        if (true) {
          if (true) {
            if (true) {
              var x = 12345;
            }
          }
        }
      }
    `,
    'helpers.js': `
      var utils = require('../../../../../shared/utils');
      function longFunction() {
        ${'// line\n'.repeat(50)}
      }
    `
  };

  const analysis = power.analyzeLegacy(codebase);
  console.log('✅ Analysis complete:');
  console.log('   Files:', analysis.summary.filesAnalyzed);
  console.log('   Findings:', analysis.summary.totalFindings);
  console.log('   High:', analysis.summary.bySeverity.high);
  console.log('   Medium:', analysis.summary.bySeverity.medium);
  console.log('   Low:', analysis.summary.bySeverity.low);

  // Plan demo
  const plan = power.generatePlan(analysis, path.join(process.cwd(), 'modernization-plan.json'));
  console.log('✅ Modernization plan generated:', plan.plan.totalPhases, 'phases');
  plan.plan.phases.forEach(p => console.log(`   Phase ${p.phase}: ${p.name} (${p.duration}) — ${p.tasks.length} tasks`));

  // Strangler demo
  const strangler = power.createStrangler('legacy-payment', 'stripe-payment', path.join(process.cwd(), 'PaymentFacade.js'));
  console.log('✅ Strangler facade created:', strangler.target, '→', strangler.replacement);

  // Abstraction demo
  const abstraction = power.addAbstraction('notification', ['email', 'sms', 'push'], path.join(process.cwd(), 'NotificationAbstraction.js'));
  console.log('✅ Branch by Abstraction created:', abstraction.module, `(${abstraction.implementations.length} variants)`);

  console.log('');
  console.log('Final Status:', power.status());
}
