#!/usr/bin/env node

/**
 * ARCHITECT CLI v1.0.0
 *
 * Command-line interface for the ARCHITECT soul
 *
 * NEW Commands in v1.0.0:
 *   architect design <system> [--swarm]
 *   architect generate <type> <name>
 *   architect swarm <command>
 *   architect recommend <description>
 *   architect decompose <system>
 *   architect learn <feedback>
 *   architect status
 *
 * Grafted from 625k+ stars of architecture patterns
 */

const fs = require('fs');
const path = require('path');

const HexagonalGenerator = require('../src/generators/hexagonal-generator.cjs');
const DDDGenerator = require('../src/generators/ddd-generator.cjs');
const CQRSGenerator = require('../src/generators/cqrs-generator.cjs');
const ArchitectDecisionEngine = require('../personality/architect-engine.cjs');
const ArchitectSwarm = require('../lib/architect-swarm.cjs');
const ArchitectDecomposer = require('../lib/architect-decomposer.cjs');
const ArchitectLearningModule = require('../lib/architect-learning.cjs');

class ArchitectCLI {
  constructor() {
    this.generators = {
      hexagonal: new HexagonalGenerator(),
      ddd: new DDDGenerator(),
      cqrs: new CQRSGenerator()
    };
    this.decisionEngine = new ArchitectDecisionEngine();
    this.learning = new ArchitectLearningModule();
    this.version = '1.0.0';
  }

  async run(args) {
    const command = args[0];

    console.log('');
    console.log(' ARCHITECT v' + this.version);
    console.log('   Master of System Design');
    console.log('   Powered by 625,000+ GitHub stars');
    console.log('');

    switch (command) {
      case 'design':
        await this.cmdDesign(args.slice(1));
        break;
      case 'generate':
      case 'gen':
        await this.cmdGenerate(args.slice(1));
        break;
      case 'swarm':
        await this.cmdSwarm(args.slice(1));
        break;
      case 'recommend':
        await this.cmdRecommend(args.slice(1));
        break;
      case 'decompose':
        await this.cmdDecompose(args.slice(1));
        break;
      case 'learn':
        await this.cmdLearn(args.slice(1));
        break;
      case 'status':
        this.cmdStatus();
        break;
      case 'help':
      case '--help':
      case '-h':
        this.showHelp();
        break;
      case 'version':
      case '--version':
      case '-v':
        console.log('v' + this.version);
        break;
      default:
        console.log(' Unknown command:', command);
        console.log('   Run "architect help" for usage');
        process.exit(1);
    }
  }

  async cmdDesign(args) {
    const systemName = args[0];
    const useSwarm = args.includes('--swarm');

    if (!systemName) {
      console.log(' Usage: architect design <system-name> [--swarm]');
      console.log('   Example: architect design e-commerce-platform --swarm');
      process.exit(1);
    }

    console.log(' Starting design session for:', systemName);
    console.log('');

    if (useSwarm) {
      const swarm = new ArchitectSwarm();
      swarm.initializeDefaultSwarm();
      const result = await swarm.designSystem({
        name: systemName,
        domains: [{ name: systemName, entities: [], requirements: [] }],
        infrastructure: { database: 'postgresql' }
      });

      console.log('');
      console.log(' Swarm Design Complete');
      console.log('   Subsystems:', result.subsystems.length);
      console.log('   Integration Points:', result.integrationPoints.length);
      console.log('   Next Steps:', result.nextSteps.length);
    } else {
      const recommendation = this.decisionEngine.recommendArchitecture(systemName);
      console.log(' Recommended Architecture:');
      console.log('   Primary Pattern:', recommendation.primaryPattern);
      console.log('   Confidence:', Math.round(recommendation.confidence * 100) + '%');
      console.log('');
      console.log(recommendation.rationale);
    }
  }

  async cmdGenerate(args) {
    const type = args[0];
    const name = args[1];

    if (!type || !name) {
      console.log(' Usage: architect generate <type> <name>');
      console.log('   Types: hexagonal, ddd, cqrs, modular');
      console.log('   Example: architect generate hexagonal order-service');
      process.exit(1);
    }

    console.log(' Generating', type, 'architecture for', name);
    console.log('');

    const projectPath = path.join(process.cwd(), name);

    if (fs.existsSync(projectPath)) {
      console.error(' Directory "' + name + '" already exists');
      process.exit(1);
    }

    let result;
    switch (type) {
      case 'hexagonal':
        result = await this.generateHexagonal(name, projectPath);
        break;
      case 'ddd':
        result = await this.generateDDD(name, projectPath);
        break;
      case 'cqrs':
        result = await this.generateCQRS(name, projectPath);
        break;
      case 'modular':
        result = await this.generateModular(name, projectPath);
        break;
      default:
        console.error(' Unknown type:', type);
        console.log('   Valid types: hexagonal, ddd, cqrs, modular');
        process.exit(1);
    }

    this.writeFiles(projectPath, result.files);

    console.log('');
    console.log(' Generated', result.files.length, 'files');
    console.log('   Location:', projectPath);
    console.log('');
    console.log(' Next steps:');
    result.nextSteps.forEach(step => console.log('   ' + step));
    console.log('');
    console.log(' ARCHITECT says: "Design for change. Build for the future."');
  }

  async generateHexagonal(name, projectPath) {
    return this.generators.hexagonal.generate({
      name: this.capitalize(name),
      domain: {
        entities: [{ name: this.capitalize(name), fields: [{ name: 'id' }, { name: 'data' }] }]
      },
      application: {
        useCases: [{ action: 'Create' }, { action: 'Update' }, { action: 'Get' }]
      },
      infrastructure: {
        database: true,
        http: {
          routes: [
            { method: 'post', path: '/', name: 'create' },
            { method: 'put', path: '/:id', name: 'update' },
            { method: 'get', path: '/:id', name: 'get' }
          ]
        }
      }
    });
  }

  async generateDDD(name, projectPath) {
    return this.generators.ddd.generate({
      domain: {},
      aggregates: [{ name: this.capitalize(name), entities: ['Entity1', 'Entity2'] }],
      services: [{ name: this.capitalize(name) + 'Management' }],
      events: [{ name: this.capitalize(name) + 'Created' }, { name: this.capitalize(name) + 'Updated' }]
    });
  }

  async generateCQRS(name, projectPath) {
    return this.generators.cqrs.generate({
      aggregate: this.capitalize(name),
      readModel: this.capitalize(name) + 'View'
    });
  }

  async generateModular(name, projectPath) {
    const hexResult = await this.generateHexagonal(name, projectPath);
    const dddResult = await this.generateDDD(name, projectPath);
    return {
      files: [...hexResult.files, ...dddResult.files],
      nextSteps: [...hexResult.nextSteps, 'Define module boundaries in domain/', 'Set up module communication via domain events']
    };
  }

  async cmdSwarm(args) {
    const subcommand = args[0];

    if (subcommand === 'init') {
      const swarm = new ArchitectSwarm();
      swarm.initializeDefaultSwarm();
      console.log(' Swarm initialized with', swarm.agents.size, 'agents:');
      for (const [role, agent] of swarm.agents) {
        console.log('   -', role, '(' + agent.specialty + ')');
      }
    } else if (subcommand === 'status') {
      const swarm = new ArchitectSwarm();
      swarm.initializeDefaultSwarm();
      const status = swarm.getSwarmStatus();
      console.log(' Swarm Status:');
      console.log('   Total Agents:', status.totalAgents);
      console.log('   Active:', status.activeAgents);
      console.log('   Idle:', status.idleAgents);
      console.log('   Strategy:', status.strategy);
    } else {
      console.log(' Usage: architect swarm <init|status>');
    }
  }

  async cmdRecommend(args) {
    const description = args.join(' ');
    if (!description) {
      console.log(' Usage: architect recommend "<system description>"');
      process.exit(1);
    }

    console.log(' Analyzing requirements...');
    console.log('');

    const recommendation = this.decisionEngine.recommendArchitecture(description);
    console.log(' Recommendation:');
    console.log('   Pattern:', recommendation.primaryPattern);
    console.log('   Confidence:', Math.round(recommendation.confidence * 100) + '%');
    console.log('');
    console.log(recommendation.rationale);
  }

  async cmdDecompose(args) {
    const systemName = args.join(' ');
    if (!systemName) {
      console.log(' Usage: architect decompose "<system description>"');
      process.exit(1);
    }

    const decomposer = new ArchitectDecomposer();
    const result = decomposer.decompose(systemName);

    console.log(' System Decomposition');
    console.log('   Type:', result.systemType);
    console.log('   Pattern:', result.pattern);
    console.log('   Subsystems:', result.subsystems.length);
    console.log('');

    result.subsystems.forEach(s => {
      console.log('   ' + s.name);
      console.log('     Priority:', s.priority);
      console.log('     Complexity:', s.complexity);
      console.log('     Est. Days:', s.estimatedDays);
      console.log('     Team Size:', s.teamSize);
    });

    console.log('');
    console.log(' Phases:');
    result.phases.forEach(p => {
      console.log('   ' + p.phase + '. ' + p.name + ' (' + p.mode + ')');
    });

    console.log('');
    console.log(' Estimates:');
    console.log('   Sequential:', result.estimates.sequentialTime, 'days');
    console.log('   Parallel:', result.estimates.parallelTime, 'days');
    console.log('   Speedup:', result.estimates.speedup.toFixed(1) + 'x');
  }

  async cmdLearn(args) {
    const feedback = args.join(' ');
    if (!feedback) {
      console.log(' Usage: architect learn "<feedback>"');
      process.exit(1);
    }

    this.learning.learnFromDesign({
      system: feedback,
      pattern: 'feedback',
      satisfaction: 0.8
    });

    const report = this.learning.getEvolutionReport();
    console.log(' Learning recorded');
    console.log('   Evolution Score:', report.evolutionScore);
    console.log('   Level:', report.level.name);
  }

  cmdStatus() {
    const report = this.learning.getEvolutionReport();
    console.log(' ARCHITECT Status');
    console.log('   Version:', this.version);
    console.log('   Evolution Score:', report.evolutionScore);
    console.log('   Level:', report.level.name);
    console.log('   Total Designs:', report.totalDesigns);
    console.log('   Top Patterns:');
    report.topPatterns.forEach(p => console.log('     -', p.pattern, '(' + p.count + ')'));
  }

  writeFiles(projectPath, files) {
    files.forEach(file => {
      const filePath = path.join(projectPath, file.path);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, file.content);
      console.log('   Created:', file.path);
    });
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  showHelp() {
    console.log('Usage: architect <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  design <system> [--swarm]   Start architectural design session');
    console.log('  generate <type> <name>      Generate architecture scaffolding');
    console.log('  swarm <init|status>         Manage design swarm');
    console.log('  recommend <description>     Recommend architecture for system');
    console.log('  decompose <system>          Decompose system into subsystems');
    console.log('  learn <feedback>            Teach Architect from feedback');
    console.log('  status                      Show Architect evolution status');
    console.log('  help                        Show this help');
    console.log('  version                     Show version');
    console.log('');
    console.log('Generation Types:');
    console.log('  hexagonal    Hexagonal Architecture (Ports & Adapters)');
    console.log('  ddd          Domain-Driven Design tactical patterns');
    console.log('  cqrs         Command Query Responsibility Segregation');
    console.log('  modular      Modular Monolith architecture');
    console.log('');
    console.log('Examples:');
    console.log('  architect design e-commerce-platform --swarm');
    console.log('  architect generate hexagonal order-service');
    console.log('  architect recommend "high-traffic API with complex domain"');
    console.log('  architect decompose "fintech payment platform"');
    console.log('');
    console.log('Powered by 625,000+ GitHub stars of architecture patterns');
  }
}

const cli = new ArchitectCLI();
cli.run(process.argv.slice(2)).catch(err => {
  console.error(' Error:', err.message);
  process.exit(1);
});
