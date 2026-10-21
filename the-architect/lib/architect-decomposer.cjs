/**
 * ARCHITECT System Decomposer
 *
 * Decomposes complex system requirements into subsystems,
 * maps dependencies, and creates phased execution plans.
 *
 * Grafted from: Vikki Decomposer (soul-operator-miss-vikki v1.2.0)
 * Enhanced with: Architecture-specific decomposition patterns
 * New sources: DeepResearchAgent (3.4k), Claude Swarm (173)
 */

class ArchitectDecomposer {
  constructor(options = {}) {
    this.patternMatchers = this.initializePatternMatchers();
  }

  initializePatternMatchers() {
    return {
      'e-commerce': {
        subsystems: ['catalog', 'cart', 'orders', 'payments', 'inventory', 'users', 'notifications'],
        pattern: 'modular-monolith',
        database: 'postgresql'
      },
      'social-media': {
        subsystems: ['users', 'posts', 'feeds', 'messaging', 'notifications', 'moderation'],
        pattern: 'microservices',
        database: 'mongodb'
      },
      'saas-platform': {
        subsystems: ['auth', 'billing', 'tenancy', 'api', 'webhooks', 'analytics'],
        pattern: 'multi-tenant-modular',
        database: 'postgresql'
      },
      'iot-platform': {
        subsystems: ['devices', 'telemetry', 'rules', 'alerts', 'dashboard', 'firmware'],
        pattern: 'event-driven',
        database: 'timeseries'
      },
      'fintech': {
        subsystems: ['accounts', 'transactions', 'compliance', 'reporting', 'integrations'],
        pattern: 'cqrs-event-sourcing',
        database: 'postgresql'
      },
      'healthcare': {
        subsystems: ['patients', 'appointments', 'records', 'billing', 'compliance'],
        pattern: 'hexagonal-ddd',
        database: 'postgresql'
      }
    };
  }

  /**
   * Decompose a system description into architecture
   */
  decompose(systemDescription) {
    const desc = systemDescription.toLowerCase();

    // Detect system type
    let systemType = 'generic';
    for (const [type, config] of Object.entries(this.patternMatchers)) {
      if (desc.includes(type)) {
        systemType = type;
        break;
      }
    }

    // Generate subsystems
    const subsystems = this.generateSubsystems(systemType, desc);

    // Map dependencies
    const dependencies = this.mapDependencies(subsystems);

    // Create execution phases
    const phases = this.createPhases(subsystems, dependencies);

    // Calculate estimates
    const estimates = this.calculateEstimates(subsystems, phases);

    return {
      systemType,
      pattern: this.patternMatchers[systemType]?.pattern || 'layered',
      subsystems,
      dependencies,
      phases,
      estimates,
      criticalPath: this.findCriticalPath(phases, dependencies),
      recommendations: this.generateRecommendations(systemType, subsystems)
    };
  }

  generateSubsystems(systemType, description) {
    const base = this.patternMatchers[systemType]?.subsystems || ['core', 'api', 'database', 'frontend'];

    return base.map((name, index) => ({
      id: name,
      name: this.capitalize(name) + 'Subsystem',
      priority: index + 1,
      complexity: this.estimateComplexity(name, description),
      interfaces: ['api', 'events', 'database'],
      requirements: this.inferRequirements(name, description),
      teamSize: this.estimateTeamSize(name),
      estimatedDays: this.estimateDays(name)
    }));
  }

  estimateComplexity(name, description) {
    const complexityKeywords = {
      high: ['real-time', 'distributed', 'complex', 'enterprise', 'microservices'],
      medium: ['api', 'dashboard', 'notifications', 'reporting'],
      low: ['simple', 'basic', 'static', 'landing']
    };

    for (const [level, keywords] of Object.entries(complexityKeywords)) {
      if (keywords.some(k => description.includes(k))) {
        return level;
      }
    }

    return 'medium';
  }

  inferRequirements(name, description) {
    const requirements = [];

    if (name.includes('auth') || name.includes('user')) {
      requirements.push('authentication', 'authorization', 'user-management');
    }
    if (name.includes('payment') || name.includes('billing')) {
      requirements.push('payment-processing', 'invoicing', 'tax-calculation');
    }
    if (name.includes('notification')) {
      requirements.push('email', 'push', 'sms');
    }
    if (name.includes('api')) {
      requirements.push('rest', 'documentation', 'rate-limiting');
    }

    return requirements;
  }

  estimateTeamSize(name) {
    const sizes = {
      auth: 2, users: 2, payments: 3, orders: 3,
      catalog: 2, inventory: 2, messaging: 3,
      core: 3, api: 2, database: 1, frontend: 2
    };
    return sizes[name] || 2;
  }

  estimateDays(name) {
    const days = {
      auth: 14, users: 10, payments: 21, orders: 18,
      catalog: 14, inventory: 12, messaging: 16,
      core: 20, api: 10, database: 7, frontend: 14
    };
    return days[name] || 14;
  }

  mapDependencies(subsystems) {
    const dependencies = [];

    // Auth is foundational
    const auth = subsystems.find(s => s.id.includes('auth') || s.id.includes('user'));
    if (auth) {
      subsystems.filter(s => s.id !== auth.id).forEach(s => {
        dependencies.push({ from: s.id, to: auth.id, type: 'requires' });
      });
    }

    // API depends on core services
    const api = subsystems.find(s => s.id === 'api');
    const core = subsystems.find(s => s.id === 'core');
    if (api && core) {
      dependencies.push({ from: api.id, to: core.id, type: 'uses' });
    }

    // Frontend depends on API
    const frontend = subsystems.find(s => s.id === 'frontend');
    if (frontend && api) {
      dependencies.push({ from: frontend.id, to: api.id, type: 'consumes' });
    }

    return dependencies;
  }

  createPhases(subsystems, dependencies) {
    // Phase 1: Foundation (no dependencies)
    const foundational = subsystems.filter(s =>
      !dependencies.some(d => d.from === s.id)
    );

    // Phase 2: Core (depends on foundation)
    const core = subsystems.filter(s =>
      dependencies.some(d => d.from === s.id && foundational.find(f => f.id === d.to))
    );

    // Phase 3: Features (depends on core)
    const features = subsystems.filter(s =>
      !foundational.includes(s) && !core.includes(s)
    );

    return [
      { phase: 1, name: 'Foundation', mode: 'parallel', subsystems: foundational.map(s => s.id) },
      { phase: 2, name: 'Core Services', mode: 'sequential', subsystems: core.map(s => s.id) },
      { phase: 3, name: 'Features', mode: 'parallel', subsystems: features.map(s => s.id) }
    ].filter(p => p.subsystems.length > 0);
  }

  calculateEstimates(subsystems, phases) {
    const totalDays = subsystems.reduce((sum, s) => sum + s.estimatedDays, 0);

    // Sequential time = sum of all days
    const sequentialTime = totalDays;

    // Parallel time = max phase duration
    const parallelTime = Math.max(...phases.map(phase => {
      const phaseSystems = subsystems.filter(s => phase.subsystems.includes(s.id));
      return phaseSystems.reduce((sum, s) => sum + s.estimatedDays, 0);
    }));

    return {
      totalSubsystems: subsystems.length,
      sequentialTime,
      parallelTime,
      speedup: sequentialTime / parallelTime,
      timeSaved: sequentialTime - parallelTime,
      totalTeamSize: subsystems.reduce((sum, s) => sum + s.teamSize, 0)
    };
  }

  findCriticalPath(phases, dependencies) {
    // Simplified critical path = longest phase
    const longestPhase = phases.reduce((longest, phase) => {
      const phaseDays = phase.subsystems.length * 14; // rough estimate
      return phaseDays > longest.days ? { phase: phase.name, days: phaseDays } : longest;
    }, { phase: '', days: 0 });

    return {
      path: longestPhase.phase,
      duration: longestPhase.days,
      risk: longestPhase.days > 30 ? 'high' : 'medium'
    };
  }

  generateRecommendations(systemType, subsystems) {
    const recs = [];

    if (subsystems.length > 5) {
      recs.push('Consider modular monolith before microservices');
    }

    if (systemType === 'fintech' || systemType === 'healthcare') {
      recs.push('Implement event sourcing for audit trails');
      recs.push('Add comprehensive compliance testing');
    }

    if (subsystems.find(s => s.id.includes('real-time'))) {
      recs.push('Use WebSockets or Server-Sent Events for real-time features');
    }

    recs.push('Start with domain layer (inner hexagon)');
    recs.push('Define API contracts before implementation');
    recs.push('Add observability from day one (logging, metrics, tracing)');

    return recs;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Decompose AND execute design
   */
  async decomposeAndExecute(systemDescription, architect) {
    const decomposition = this.decompose(systemDescription);

    console.log(' Decomposition Complete');
    console.log('   System Type:', decomposition.systemType);
    console.log('   Pattern:', decomposition.pattern);
    console.log('   Subsystems:', decomposition.subsystems.length);
    console.log('   Phases:', decomposition.phases.length);
    console.log('   Est. Sequential Time:', decomposition.estimates.sequentialTime, 'days');
    console.log('   Est. Parallel Time:', decomposition.estimates.parallelTime, 'days');
    console.log('   Speedup:', decomposition.estimates.speedup.toFixed(1) + 'x');

    // Execute design for each subsystem
    const designs = [];
    for (const phase of decomposition.phases) {
      console.log('');
      console.log(' Phase:', phase.name, '(' + phase.mode + ')');

      const phaseSystems = decomposition.subsystems.filter(s =>
        phase.subsystems.includes(s.id)
      );

      if (phase.mode === 'parallel') {
        await Promise.all(phaseSystems.map(async subsystem => {
          const design = await this.designSubsystem(subsystem, architect);
          designs.push(design);
        }));
      } else {
        for (const subsystem of phaseSystems) {
          const design = await this.designSubsystem(subsystem, architect);
          designs.push(design);
        }
      }
    }

    return {
      decomposition,
      designs,
      executionPlan: {
        phases: decomposition.phases,
        criticalPath: decomposition.criticalPath,
        recommendations: decomposition.recommendations
      }
    };
  }

  async designSubsystem(subsystem, architect) {
    console.log('   Designing:', subsystem.name);

    // Simulate design process
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      subsystem: subsystem.name,
      pattern: 'hexagonal',
      components: [
        { name: subsystem.name + 'Entity', type: 'entity' },
        { name: subsystem.name + 'Repository', type: 'repository' },
        { name: subsystem.name + 'Service', type: 'service' },
        { name: subsystem.name + 'Controller', type: 'controller' }
      ],
      interfaces: [
        { name: 'I' + subsystem.name + 'Port', methods: ['create', 'update', 'delete', 'find'] }
      ],
      database: { type: 'postgresql', tables: [subsystem.id] }
    };
  }
}

module.exports = ArchitectDecomposer;

// CLI Demo
if (require.main === module) {
  const decomposer = new ArchitectDecomposer();

  console.log(' Architect Decomposer');
  console.log('');

  const result = decomposer.decompose('Build an e-commerce platform with real-time inventory and payment processing');

  console.log('Decomposition:');
  console.log('  Type:', result.systemType);
  console.log('  Pattern:', result.pattern);
  console.log('  Subsystems:', result.subsystems.map(s => s.name).join(', '));
  console.log('');
  console.log('Estimates:');
  console.log('  Sequential:', result.estimates.sequentialTime, 'days');
  console.log('  Parallel:', result.estimates.parallelTime, 'days');
  console.log('  Speedup:', result.estimates.speedup.toFixed(1) + 'x');
  console.log('');
  console.log('Phases:');
  result.phases.forEach(p => {
    console.log('  ' + p.phase + '. ' + p.name + ' (' + p.mode + '): ' + p.subsystems.join(', '));
  });
}
