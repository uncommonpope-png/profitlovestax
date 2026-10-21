/**
 * ARCHITECT Agent Connection SDK
 *
 * The Architect connects to external agents and systems:
 * - AutoGPT, MetaGPT, LangChain, CrewAI agents
 * - CI/CD pipelines (GitHub Actions, GitLab CI)
 * - Design tools (Figma, Miro)
 * - Documentation generators (Swagger, TypeDoc)
 * - Any system with HTTP or npm
 *
 * What she does:
 * 1. Receives system requirements from external agents
 * 2. Designs architecture using her arsenal
 * 3. Returns architecture documents + code scaffolding
 * 4. Learns from each interaction
 * 5. Becomes better at designing for specific domains
 *
 * Grafted from: Vikki Agent SDK (soul-operator-miss-vikki v1.2.0)
 * Enhanced with: Architecture-specific endpoints and design delivery
 */

const http = require('http');
const ArchitectLearningModule = require('./architect-learning.cjs');

class ArchitectAgentSDK {
  constructor(options = {}) {
    this.port = options.port || 7778;
    this.learning = new ArchitectLearningModule(options);
    this.agents = new Map();
    this.designQueue = [];
    this.isRunning = false;
    this.config = {
      maxConcurrentDesigns: options.maxConcurrentDesigns || 2,
      defaultDesignTime: options.defaultDesignTime || 30, // minutes
      allowOverwrites: options.allowOverwrites !== false,
      safeMode: options.safeMode !== false
    };
  }

  /**
   * Start HTTP server for agent connections
   */
  startServer() {
    if (this.isRunning) {
      console.log('Architect: Server already running on port ' + this.port);
      return;
    }

    this.server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url, 'http://localhost:' + this.port);

      if (url.pathname === '/health') {
        this.handleHealth(req, res);
      } else if (url.pathname === '/design' && req.method === 'POST') {
        this.handleDesign(req, res);
      } else if (url.pathname === '/recommend' && req.method === 'POST') {
        this.handleRecommend(req, res);
      } else if (url.pathname === '/generate' && req.method === 'POST') {
        this.handleGenerate(req, res);
      } else if (url.pathname === '/learn' && req.method === 'POST') {
        this.handleLearn(req, res);
      } else if (url.pathname === '/status') {
        this.handleStatus(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Not found',
          architectSays: 'Try /design, /recommend, /generate, /learn, /status, or /health'
        }));
      }
    });

    this.server.listen(this.port, () => {
      this.isRunning = true;
      console.log(' Architect Agent SDK running on port ' + this.port);
      console.log('  POST /design     - Design system architecture');
      console.log('  POST /recommend  - Get architecture recommendation');
      console.log('  POST /generate   - Generate code scaffolding');
      console.log('  POST /learn      - Teach Architect');
      console.log('  GET  /status     - Get status');
      console.log('  GET  /health     - Health check');
      console.log('');
      console.log('Architect says: "Connected. Ready to design."');
    });

    return this;
  }

  handleHealth(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'Architect Agent SDK',
      version: '1.0.0',
      uptime: process.uptime()
    }));
  }

  async handleDesign(req, res) {
    const body = await this.parseBody(req);

    if (!body.system) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing system name' }));
      return;
    }

    console.log(' Design request from agent:', body.agent || 'unknown');
    console.log('   System:', body.system);
    console.log('   Requirements:', body.requirements?.join(', ') || 'none specified');

    // Get recommendations
    const recommendations = this.learning.getRecommendations(
      body.system + ' ' + (body.requirements?.join(' ') || '')
    );

    // Generate architecture response
    const architecture = {
      system: body.system,
      primaryPattern: recommendations[0]?.pattern || 'layered',
      confidence: recommendations[0]?.confidence || 0.5,
      allRecommendations: recommendations,
      patterns: recommendations.map(r => r.pattern),
      structure: this.generateStructure(recommendations[0]?.pattern, body),
      rationale: recommendations[0]?.reason || 'Default layered architecture',
      nextSteps: [
        'Run: architect generate ' + recommendations[0]?.pattern + ' ' + body.system,
        'Review generated files',
        'Customize domain entities and business logic',
        'Add tests and documentation'
      ]
    };

    // Learn from this design request
    this.learning.learnFromDesign({
      system: body.system,
      pattern: architecture.primaryPattern,
      context: { requirements: body.requirements },
      satisfaction: 0.7 // Assume positive until feedback
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(architecture));
  }

  async handleRecommend(req, res) {
    const body = await this.parseBody(req);
    const description = body.description || body.system || '';

    const recommendations = this.learning.getRecommendations(description);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      description,
      recommendations,
      topPattern: recommendations[0]?.pattern,
      topConfidence: recommendations[0]?.confidence
    }));
  }

  async handleGenerate(req, res) {
    const body = await this.parseBody(req);

    if (!body.type || !body.name) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing type or name' }));
      return;
    }

    // Return generation instructions (actual generation happens via CLI)
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      type: body.type,
      name: body.name,
      command: 'architect generate ' + body.type + ' ' + body.name,
      message: 'Run the above command to generate scaffolding',
      availableTypes: ['hexagonal', 'ddd', 'cqrs', 'modular', 'nestjs', 'xstate']
    }));
  }

  async handleLearn(req, res) {
    const body = await this.parseBody(req);

    if (body.design) {
      this.learning.learnFromDesign(body.design);
    }

    if (body.memory) {
      this.learning.importMemory(body.memory);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      learned: true,
      evolutionScore: this.learning.memory.evolutionScore,
      level: this.learning.getLevel()
    }));
  }

  handleStatus(req, res) {
    const report = this.learning.getEvolutionReport();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ...report,
      sdk: {
        port: this.port,
        running: this.isRunning,
        connectedAgents: this.agents.size,
        queuedDesigns: this.designQueue.length
      }
    }));
  }

  parseBody(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({});
        }
      });
    });
  }

  generateStructure(pattern, config) {
    const structures = {
      hexagonal: {
        layers: ['domain', 'application', 'infrastructure'],
        description: 'Ports & Adapters - domain in center, dependencies point inward'
      },
      ddd: {
        layers: ['domain', 'application', 'infrastructure', 'presentation'],
        description: 'Domain-Driven Design - ubiquitous language, bounded contexts'
      },
      nestjs: {
        layers: ['modules', 'controllers', 'services', 'providers'],
        description: 'NestJS modular - decorators, DI, controllers, pipes, guards'
      },
      xstate: {
        layers: ['machines', 'actors', 'services', 'components'],
        description: 'Statecharts - finite state machines, actors, event-driven'
      },
      cqrs: {
        layers: ['commands', 'queries', 'events', 'projections'],
        description: 'CQRS - separate read/write models, event sourcing optional'
      }
    };

    return structures[pattern] || structures.hexagonal;
  }

  /**
   * Connect to external agent
   */
  static connect(endpoint) {
    return {
      async design(system, requirements = []) {
        const response = await fetch(endpoint + '/design', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ system, requirements })
        });
        return response.json();
      },

      async recommend(description) {
        const response = await fetch(endpoint + '/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description })
        });
        return response.json();
      },

      async generate(type, name) {
        const response = await fetch(endpoint + '/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, name })
        });
        return response.json();
      }
    };
  }
}

module.exports = ArchitectAgentSDK;

// CLI Demo
if (require.main === module) {
  const sdk = new ArchitectAgentSDK();
  sdk.startServer();
}
