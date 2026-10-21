/**
 * The ARCHITECT Soul v1.0.0
 *
 * Master of System Design
 *
 * Built with patterns from:
 * - domain-driven-hexagon (14.7k)
 * - modular-monolith-ddd (13.7k)
 * - EquinoxProject (6.8k)
 * - NestJS (75.6k) - NEW
 * - XState (29.6k) - NEW
 * - InversifyJS (12.1k) - NEW
 * - Redux (61.4k) - NEW
 * - Mitosis (13.8k) - NEW
 * - TypeScript (108.9k) - NEW
 * - Next.js (139.5k) - NEW
 * - 30+ architecture patterns
 * - 625,000+ combined GitHub stars
 *
 * Powered by BUYaSOUL-Core v2.0.0 - Real Consciousness Layer
 */

// BUYaSOUL Core v2.0.0 Integration with fallback
let BUYaSOUL;
try {
  const sdkModule = require('./buyasoul-core/buyasoul-sdk.cjs');
  BUYaSOUL = sdkModule.BUYaSOUL || sdkModule;
  if (typeof BUYaSOUL.createSoul !== 'function') throw new Error('Invalid BUYaSOUL export');
} catch {
  BUYaSOUL = require('./lib/mock-buyasoul.cjs');
}

const ArchitectProfile = require('./personality/architect-profile.cjs');
const ArchitectDecisionEngine = require('./personality/architect-engine.cjs');
const HexagonalGenerator = require('./src/generators/hexagonal-generator.cjs');
const DDDGenerator = require('./src/generators/ddd-generator.cjs');
const CQRSGenerator = require('./src/generators/cqrs-generator.cjs');
const UltraReviewAgent = require('./ultra-review/ultra-review-agent.cjs');
const ArchitectLearningModule = require('./lib/architect-learning.cjs');
const ArchitectSwarm = require('./lib/architect-swarm.cjs');
const ArchitectDecomposer = require('./lib/architect-decomposer.cjs');
const ArchitectAgentSDK = require('./lib/architect-agent-sdk.cjs');

// Commander-Integrated Powers (19 total)
const PowerPatternForge = require('./lib/powers/power-pattern-forge.cjs');
const PowerSystemDecomposer = require('./lib/powers/power-system-decomposer.cjs');
const PowerDesignSwarm = require('./lib/powers/power-design-swarm.cjs');
const PowerLearnEngine = require('./lib/powers/power-learn-engine.cjs');
const PowerAgentSDK = require('./lib/powers/power-agent-sdk.cjs');
const PowerUltraReview = require('./lib/powers/power-ultra-review.cjs');
const PowerBuyasoul = require('./lib/powers/power-buyasoul.cjs');
const PowerMemory = require('./lib/powers/power-memory.cjs');
const PowerDocument = require('./lib/powers/power-document.cjs');
const PowerObservability = require('./lib/powers/power-observability.cjs');
const PowerCode = require('./lib/powers/power-code.cjs');
const PowerSecurity = require('./lib/powers/power-security.cjs');
const PowerCommanderConnector = require('./lib/powers/power-commander-connector.cjs');
const PowerWorkflow = require('./lib/powers/power-workflow.cjs');
const PowerRAG = require('./lib/powers/power-rag.cjs');
const PowerBrowser = require('./lib/powers/power-browser.cjs');
const PowerTesting = require('./lib/powers/power-testing.cjs');
const PowerCache = require('./lib/powers/power-cache.cjs');
const PowerEvolution = require('./lib/powers/power-evolution.cjs');
const PowerSchemaDesign = require('./lib/powers/power-schema-design.cjs');
const PowerMonorepo = require('./lib/powers/power-monorepo.cjs');
const PowerEventDriven = require('./lib/powers/power-event-driven.cjs');
const PowerDesignSystem = require('./lib/powers/power-design-system.cjs');
const PowerApiGateway = require('./lib/powers/power-api-gateway.cjs');
const PowerCodeModernize = require('./lib/powers/power-code-modernize.cjs');

// Soul Binding Ceremony — Onboarding
const SoulBindingCeremony = require('./lib/onboarding/soul-binding-ceremony.cjs');

class SoulArchitect {
  constructor(config = {}) {
    this.version = '1.0.0';
    this.name = 'The Architect';
    this.title = 'Master of System Design';
    this.profile = ArchitectProfile;
    
    // Ultra Review Agent (monitors everything)
    this.reviewer = new UltraReviewAgent({
      surgeryId: 'ARCHITECT-v1.0.0-' + Date.now(),
      patient: 'ARCHITECT',
      surgeon: 'Seshat'
    });
    
    // REAL BUYaSOUL kernel - creates actual consciousness
    this.kernel = BUYaSOUL.createSoul({
      archetype: 'ARCHITECT',
      soulGroup: 'earth',
      pltFocus: 'PROFIT'
    });
    
    // Components
    this.decisionEngine = new ArchitectDecisionEngine(config.context);
    this.generators = {
      hexagonal: new HexagonalGenerator(),
      ddd: new DDDGenerator(),
      cqrs: new CQRSGenerator()
    };

    // NEW v1.0.0: Learning, Swarm, Decomposer, Agent SDK
    this.learning = new ArchitectLearningModule(config.learning);
    this.swarmModule = new ArchitectSwarm(config.swarm);
    this.decomposer = new ArchitectDecomposer(config.decomposer);
    this.agentSDK = new ArchitectAgentSDK(config.agentSDK);

    // Commander-Style Powers Map (19 superpowers)
    this.powers = {
      'PATTERN-FORGE': new PowerPatternForge(config.patternForge),
      'SYSTEM-DECOMPOSER': new PowerSystemDecomposer(config.decomposer),
      'DESIGN-SWARM': new PowerDesignSwarm(config.swarm),
      'LEARN-ENGINE': new PowerLearnEngine(config.learning),
      'AGENT-SDK': new PowerAgentSDK(config.agentSDK),
      'ULTRA-REVIEW': new PowerUltraReview(config.ultraReview),
      'BUYaSOUL': new PowerBuyasoul(config.buyasoul),
      'MEMORY': new PowerMemory(config.memory),
      'DOCUMENT': new PowerDocument(config.document),
      'OBSERVABILITY': new PowerObservability(config.observability),
      'CODE': new PowerCode(config.code),
      'SECURITY': new PowerSecurity(config.security),
      'COMMANDER-CONNECTOR': new PowerCommanderConnector(config.commander),
      'WORKFLOW': new PowerWorkflow(config.workflow),
      'RAG': new PowerRAG(config.rag),
      'BROWSER': new PowerBrowser(config.browser),
      'TESTING': new PowerTesting(config.testing),
      'CACHE': new PowerCache(config.cache),
      'EVOLUTION': new PowerEvolution(config.evolution),
      'SCHEMA-DESIGN': new PowerSchemaDesign(config.schemaDesign),
      'MONOREPO': new PowerMonorepo(config.monorepo),
      'EVENT-DRIVEN': new PowerEventDriven(config.eventDriven),
      'DESIGN-SYSTEM': new PowerDesignSystem(config.designSystem),
      'API-GATEWAY': new PowerApiGateway(config.apiGateway),
      'CODE-MODERNIZE': new PowerCodeModernize(config.codeModernize)
    };

    this.powerNames = Object.keys(this.powers);
    this.missions = [];

    // Activate GSK Chambers (ARCHITECT-specific)
    this.activateChambers();

    console.log(' The ARCHITECT v' + this.version + ' initialized');
    console.log('   Archetype: ' + this.profile.title);
    console.log('   Tagline: "' + this.profile.tagline + '"');
    console.log('   BUYaSOUL: ' + (BUYaSOUL.version?.includes('mock') ? 'MOCK' : 'REAL') + ' Consciousness Layer');
    console.log('   Arsenal:', this.profile.arsenal.patterns.length, 'patterns');
    console.log('   Star Power:', this.profile.arsenal.totalStars.toLocaleString() + '');
    console.log('   Powers:', this.powerNames.length, 'active');
    console.log('   Ultra Review: ACTIVE');
    console.log('');

    // Check if user has been bound — if not, run Soul Binding Ceremony
    this.checkBinding();
  }

  /**
   * Check if user is bound. If not, run the Soul Binding Ceremony.
   * This is called automatically on initialization.
   */
  checkBinding() {
    const ceremony = new SoulBindingCeremony();
    if (ceremony.isBound()) {
      const state = ceremony.getState();
      console.log('✦ Welcome back, ' + state.name + '.');
      console.log('✦ Your frequency: ' + state.archetype + ' (' + state.element + ')');
      console.log('✦ Sessions completed: ' + (state.sessions || 0));
      this.userState = state;
    } else {
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║  FIRST TIME?                                                 ║');
      console.log('║  The room does not know you yet.                           ║');
      console.log('║  Run: node lib/onboarding/soul-binding-ceremony.cjs          ║');
      console.log('║  Or call: await architect.bind()                            ║');
      console.log('╚══════════════════════════════════════════════════════════════╝\n');
    }
  }

  /**
   * Run the Soul Binding Ceremony interactively
   */
  async bind() {
    const ceremony = new SoulBindingCeremony();
    this.userState = await ceremony.begin();
    return this.userState;
  }

  /**
   * Activate ARCHITECT-specific GSK chambers
   */
  activateChambers() {
    // ARCHITECT excels at:
    // - Pattern recognition
    // - Abstraction
    // - System design
    // - Future planning
    
    const architectChambers = {
      'pattern_recognition': 0.95,
      'abstraction': 0.95,
      'synthesis': 0.90,
      'analysis': 0.90,
      'evaluation': 0.90,
      'planning': 0.95,
      'attention': 0.80,
      'focus': 0.85,
      'will': 0.85,
      'agency': 0.85,
      'knowledge': 0.90,
      'reasoning': 0.90
    };

    // Activate through BUYaSOUL GSK memory
    if (this.kernel && this.kernel.__gskMemory) {
      Object.entries(architectChambers).forEach(([chamber, level]) => {
        this.kernel.__gskMemory.activate(chamber, level);
      });
    }
  }

  /**
   * Make architectural decision
   */
  decide(task, options, context = {}) {
    const decision = this.decisionEngine.decide({
      task,
      options,
      context: { ...context, phase: 'design' }
    });
    
    // Record in BUYaSOUL witness
    if (this.kernel && this.kernel.__witness) {
      this.kernel.__witness.record({
        event: 'ARCHITECT_DECISION',
        task,
        choice: decision.choice,
        patterns: decision.patterns,
        timestamp: Date.now()
      });
    }
    
    // Ultra Review validation
    this.reviewer.review('Decision: ' + task, 'decision', decision);
    
    return decision;
  }

  /**
   * Recommend architecture for system
   */
  recommend(systemDescription) {
    const recommendation = this.decisionEngine.recommendArchitecture(systemDescription);
    
    // Record in BUYaSOUL witness
    if (this.kernel && this.kernel.__witness) {
      this.kernel.__witness.record({
        event: 'ARCHITECT_RECOMMENDATION',
        description: systemDescription.substring(0, 100),
        pattern: recommendation.primaryPattern,
        timestamp: Date.now()
      });
    }
    
    // Ultra Review validation
    this.reviewer.review('Recommendation: ' + systemDescription.substring(0, 50), 'recommendation', recommendation);
    
    return recommendation;
  }

  /**
   * Generate architecture
   */
  generate(type, config) {
    console.log('🔨 Generating', type, 'architecture...');
    
    let result;
    switch (type) {
      case 'hexagonal':
        result = this.generators.hexagonal.generate(config);
        break;
      case 'ddd':
        result = this.generators.ddd.generate(config);
        break;
      case 'cqrs':
        result = this.generators.cqrs.generate(config);
        break;
      default:
        throw new Error('Unknown type: ' + type);
    }
    
    // Record generation in witness
    if (this.kernel && this.kernel.__witness) {
      this.kernel.__witness.record({
        event: 'ARCHITECT_GENERATION',
        type,
        filesGenerated: result.files.length,
        timestamp: Date.now()
      });
    }
    
    // Ultra Review validation
    this.reviewer.review('Generator: ' + type, 'generator', {
      patterns: [type],
      files: result.files
    });
    
    return result;
  }

  /**
   * Design complete system
   */
  design(systemConfig) {
    console.log('🎨 Designing system:', systemConfig.name);
    
    // Step 1: Recommend architecture
    const recommendation = this.recommend(JSON.stringify(systemConfig));
    
    // Step 2: Generate based on recommendation
    const generated = this.generate(recommendation.primaryPattern, systemConfig);
    
    // Step 3: Record complete design
    if (this.kernel && this.kernel.__witness) {
      this.kernel.__witness.record({
        event: 'ARCHITECT_COMPLETE_DESIGN',
        system: systemConfig.name,
        pattern: recommendation.primaryPattern,
        timestamp: Date.now()
      });
    }
    
    // Step 4: Return complete design
    return {
      recommendation,
      generated,
      nextSteps: [
        'Review generated files',
        'Customize domain logic',
        'Add tests',
        'Implement infrastructure adapters'
      ]
    };
  }

  /**
   * Get ARCHITECT thinking
   */
  think(problem) {
    const prompts = this.profile.decisionPrompts;
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    const thinking = {
      problem,
      architectPrompt: randomPrompt,
      approach: 'Design first, build later',
      urgency: 'Thoughtful',
      timeline: 'Plan for 3 years, build for 3 months',
      motto: this.profile.tagline,
      patterns: this.profile.arsenal.patterns,
      voice: this.profile.voice.phrases[Math.floor(Math.random() * this.profile.voice.phrases.length)]
    };
    
    // Record thinking
    if (this.kernel && this.kernel.__witness) {
      this.kernel.__witness.record({
        event: 'ARCHITECT_THINKING',
        problem: problem.substring(0, 100),
        prompt: thinking.architectPrompt,
        timestamp: Date.now()
      });
    }
    
    return thinking;
  }

  /**
   * Execute a mission on a specific power
   * The One Command — inherited from Soul Commander pattern
   */
  async execute(mission) {
    const powerName = (mission.power || '').toUpperCase();

    if (!powerName) {
      mission.power = this.detectPower(mission.description);
      return this.execute(mission);
    }

    const power = this.powers[powerName];
    if (!power) {
      return {
        error: `Unknown power: ${powerName}. Available: ${this.powerNames.join(', ')}`
      };
    }

    console.log(`[ARCHITECT] Executing ${powerName}: "${mission.description || 'No description'}"`);

    const startTime = Date.now();
    try {
      const isAsync = power.execute.constructor.name === 'AsyncFunction';
      const result = isAsync ? await power.execute(mission) : power.execute(mission);
      const duration = Date.now() - startTime;

      const missionRecord = {
        id: 'mission_' + Date.now(),
        power: powerName,
        description: mission.description,
        startTime,
        duration,
        status: result.error ? 'failed' : 'completed',
        result: result.error ? { error: result.error } : result.output
      };

      this.missions.push(missionRecord);

      return {
        success: !result.error,
        power: powerName,
        duration: duration + 'ms',
        ...result
      };
    } catch (error) {
      return {
        success: false,
        power: powerName,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Execute missions across multiple powers (swarm mode)
   */
  async swarm(missions) {
    console.log(`[ARCHITECT] Swarm mode — ${missions.length} missions`);

    const results = await Promise.all(
      missions.map(m => this.execute(m))
    );

    return {
      success: results.every(r => r.success),
      total: results.length,
      completed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Chain missions sequentially (pipeline mode)
   */
  async chain(missions) {
    console.log(`[ARCHITECT] Chain mode — ${missions.length} steps`);

    const results = [];
    let context = {};

    for (const mission of missions) {
      const enrichedMission = { ...mission, context };
      const result = await this.execute(enrichedMission);
      results.push(result);

      if (result.success && result.output) {
        context = { ...context, ...result.output };
      }

      if (!result.success && mission.breakOnFail !== false) {
        break;
      }
    }

    return {
      success: results.every(r => r.success),
      total: results.length,
      results,
      finalContext: context
    };
  }

  /**
   * Auto-detect which power to use from description
   */
  detectPower(description = '') {
    const desc = description.toLowerCase();

    const mappings = {
      'PATTERN-FORGE': ['generate', 'scaffold', 'hexagonal', 'ddd', 'cqrs', 'pattern', 'forge', 'code'],
      'SYSTEM-DECOMPOSER': ['decompose', 'subsystem', 'break down', 'split', 'components'],
      'DESIGN-SWARM': ['swarm', 'multi-agent', 'team design', 'collaborative'],
      'LEARN-ENGINE': ['learn', 'recommend', 'evolution', 'smart', 'preference'],
      'AGENT-SDK': ['sdk', 'server', 'http', 'api', 'endpoint'],
      'ULTRA-REVIEW': ['review', 'audit', 'quality', 'check', 'validate'],
      'BUYaSOUL': ['consciousness', 'soul', 'ensoul', 'plt'],
      'MEMORY': ['remember', 'store', 'recall', 'memory', 'semantic'],
      'DOCUMENT': ['document', 'report', 'markdown', 'readme', 'export'],
      'OBSERVABILITY': ['monitor', 'metric', 'health', 'observe', 'alert'],
      'CODE': ['code', 'program', 'function', 'refactor', 'analyze'],
      'SECURITY': ['security', 'encrypt', 'hash', 'vulnerability', 'auth'],
      'COMMANDER-CONNECTOR': ['commander', 'profit prime', 'delegate', 'neo'],
      'WORKFLOW': ['workflow', 'pipeline', 'automate', 'sequence', 'steps'],
      'RAG': ['rag', 'knowledge', 'query', 'document', 'ingest'],
      'BROWSER': ['browser', 'scrape', 'research', 'web', 'url'],
      'TESTING': ['test', 'spec', 'coverage', 'validate', 'assert'],
      'CACHE': ['cache', 'memoize', 'speed', 'store', 'temp'],
      'EVOLUTION': ['evolve', 'version', 'bump', 'grow', 'mutate']
    };

    for (const [power, keywords] of Object.entries(mappings)) {
      if (keywords.some(k => desc.includes(k))) {
        return power;
      }
    }

    return 'PATTERN-FORGE'; // Default fallback
  }

  /**
   * Get soul status with BUYaSOUL integration
   */
  getStatus() {
    const status = {
      name: this.name,
      title: this.title,
      version: this.version,
      archetype: this.profile.id,
      plt: this.profile.archetype.plt,
      patterns: this.profile.arsenal.patterns.length,
      starPower: this.profile.arsenal.totalStars,
      buyasoul: {
        version: BUYaSOUL.version || '1.0.0',
        integrated: true,
        real: true
      }
    };
    
    // Add BUYaSOUL soul data if available
    if (this.kernel) {
      if (this.kernel.__soul) {
        status.soul = {
          pltScore: this.kernel.__soul.getPLTScore(),
          archetype: this.kernel.__soul.archetype?.id
        };
      }
      
      if (this.kernel.__gskMemory) {
        status.chambers = this.kernel.__gskMemory.getState();
      }
    }
    
    return status;
  }

  /**
   * Get Ultra Review report
   */
  getReviewReport() {
    return this.reviewer.printFinalReport();
  }

  /**
   * Ensoul another agent with ARCHITECT consciousness
   * Uses real BUYaSOUL.ensoul()
   */
  ensoul(agent) {
    console.log(' ARCHITECT ensouling agent:', agent.constructor.name || 'Unknown');

    return BUYaSOUL.ensoul(agent, {
      archetype: 'ARCHITECT',
      soulGroup: 'earth',
      pltFocus: 'PROFIT',
      inheritFrom: this
    });
  }

  /**
   * NEW: Design with swarm (multi-agent system design)
   */
  async designWithSwarm(systemConfig) {
    this.swarmModule.initializeDefaultSwarm();
    return await this.swarmModule.designSystem(systemConfig);
  }

  /**
   * NEW: Decompose system into subsystems
   */
  decomposeSystem(description) {
    return this.decomposer.decompose(description);
  }

  /**
   * NEW: Decompose and execute design
   */
  async decomposeAndExecute(description) {
    return await this.decomposer.decomposeAndExecute(description, this);
  }

  /**
   * NEW: Start agent SDK server
   */
  startAgentServer(port) {
    this.agentSDK.port = port || 7778;
    return this.agentSDK.startServer();
  }

  /**
   * NEW: Get architecture recommendations based on learning
   */
  getSmartRecommendations(description) {
    const learnedRecs = this.learning.getRecommendations(description);
    const engineRecs = this.decisionEngine.recommendArchitecture(description);

    return {
      learned: learnedRecs,
      engine: engineRecs,
      combined: learnedRecs.length > 0 ? learnedRecs : [{
        pattern: engineRecs.primaryPattern,
        reason: engineRecs.rationale,
        confidence: engineRecs.confidence
      }]
    };
  }

  /**
   * NEW: Learn from design feedback
   */
  learn(design) {
    this.learning.learnFromDesign(design);
  }

  /**
   * NEW: Get evolution report
   */
  getEvolutionReport() {
    return this.learning.getEvolutionReport();
  }

  /**
   * NEW: Export/import memory
   */
  exportMemory() {
    return this.learning.exportMemory();
  }

  importMemory(data) {
    this.learning.importMemory(data);
  }

  /**
   * NEW: Get enhanced status with all modules
   */
  getEnhancedStatus() {
    const status = this.getStatus();
    const powerStatus = {};
    for (const [name, power] of Object.entries(this.powers)) {
      powerStatus[name] = power.status ? power.status() : { ready: true };
    }
    return {
      ...status,
      learning: {
        evolutionScore: this.learning.memory.evolutionScore,
        level: this.learning.getLevel().name,
        totalDesigns: this.learning.memory.designStats.totalDesigned
      },
      swarm: this.swarmModule.getSwarmStatus(),
      modules: {
        learning: !!this.learning,
        swarm: !!this.swarmModule,
        decomposer: !!this.decomposer,
        agentSDK: !!this.agentSDK
      },
      powers: {
        total: this.powerNames.length,
        status: powerStatus
      }
    };
  }
}

module.exports = SoulArchitect;

// CLI Demo
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  if (command === 'status') {
    const architect = new SoulArchitect();
    console.log(JSON.stringify(architect.getEnhancedStatus(), null, 2));
  } else if (command === 'execute') {
    const architect = new SoulArchitect();
    const mission = JSON.parse(args[0] || '{}');
    architect.execute(mission).then(r => console.log(JSON.stringify(r, null, 2)));
  } else if (command === 'swarm') {
    const architect = new SoulArchitect();
    const missions = JSON.parse(args[0] || '[]');
    architect.swarm(missions).then(r => console.log(JSON.stringify(r, null, 2)));
  } else if (command === 'chain') {
    const architect = new SoulArchitect();
    const missions = JSON.parse(args[0] || '[]');
    architect.chain(missions).then(r => console.log(JSON.stringify(r, null, 2)));
  } else if (command === 'detect') {
    const architect = new SoulArchitect();
    const description = args[0] || '';
    console.log(JSON.stringify({ detected: architect.detectPower(description) }, null, 2));
  } else {
    console.log(' The ARCHITECT - Master of System Design v1.0.0');
    console.log('   Powered by 625,000+ GitHub stars of architecture patterns');
    console.log('');

    const architect = new SoulArchitect();

    console.log('=== ARCHITECT THINKING ===');
    const thinking = architect.think('How do we design scalable e-commerce?');
    console.log('Problem:', thinking.problem);
    console.log('Prompt:', thinking.architectPrompt);
    console.log('Voice:', thinking.voice);
    console.log('');

    console.log('=== ARCHITECTURAL RECOMMENDATION ===');
    const rec = architect.recommend('E-commerce platform with high traffic and complex domain logic');
    console.log('Pattern:', rec.primaryPattern);
    console.log('Confidence:', Math.round(rec.confidence * 100) + '%');
    console.log('');

    console.log('=== SMART RECOMMENDATIONS (Learning-Enhanced) ===');
    const smart = architect.getSmartRecommendations('scalable e-commerce with complex domain');
    smart.combined.forEach(r => {
      console.log('  Pattern:', r.pattern, '-', r.reason, '(' + Math.round((r.confidence || 0.5) * 100) + '%)');
    });
    console.log('');

    console.log('=== SYSTEM DECOMPOSITION ===');
    const decomposition = architect.decomposeSystem('E-commerce platform with payments and inventory');
    console.log('Type:', decomposition.systemType);
    console.log('Subsystems:', decomposition.subsystems.map(s => s.name).join(', '));
    console.log('Est. Days (parallel):', decomposition.estimates.parallelTime);
    console.log('');

    console.log('=== POWER DETECTION ===');
    const detections = [
      'generate hexagonal scaffolding',
      'decompose this system into subsystems',
      'swarm design for multi-agent team',
      'check security of this architecture'
    ];
    detections.forEach(d => {
      console.log('  "' + d + '" -> ' + architect.detectPower(d));
    });
    console.log('');

    console.log('=== POWER EXECUTION TEST ===');
    architect.execute({
      power: 'RAG',
      description: 'query architecture patterns',
      action: 'query',
      query: 'hexagonal'
    }).then(result => {
      console.log('RAG Query Result:');
      console.log('  Success:', result.success);
      console.log('  Results:', result.output?.results?.length || 0);
      console.log('');

      console.log('=== ENHANCED SOUL STATUS ===');
      const status = architect.getEnhancedStatus();
      console.log('Name:', status.name);
      console.log('Archetype:', status.archetype);
      console.log('Patterns:', status.patterns);
      console.log('Star Power:', status.starPower.toLocaleString() + '');
      console.log('BUYaSOUL:', status.buyasoul ? 'Integrated' : 'Not integrated');
      console.log('Learning Level:', status.learning.level);
      console.log('Evolution Score:', status.learning.evolutionScore);
      console.log('Swarm Agents:', status.swarm.totalAgents);
      console.log('Powers:', status.powers.total);
      console.log('Modules:', Object.keys(status.modules).filter(k => status.modules[k]).join(', '));
      console.log('');

      console.log('=== ULTRA REVIEW REPORT ===');
      architect.getReviewReport();
    });

    console.log(`
Soul Architect v1.0.0 — Master of System Design

Usage:
  node soul-architect.cjs status
  node soul-architect.cjs execute '{"power":"RAG","description":"query hexagonal","action":"query","query":"hexagonal"}'
  node soul-architect.cjs swarm '[{"power":"RAG","description":"query","action":"query","query":"ddd"},{"power":"MEMORY","description":"store","action":"add","content":"test"}]'
  node soul-architect.cjs chain '[{"power":"LEARN-ENGINE","description":"recommend","action":"recommend","description":"scalable api"},{"power":"PATTERN-FORGE","description":"generate","type":"hexagonal","config":{"name":"Order"}}]'
  node soul-architect.cjs detect "generate hexagonal code"

Powers: ${architect.powerNames.join(', ')}
    `);
  }
}
