/**
 * Hexagonal Architecture Generator v1.0.0
 * 
 * Generates complete hexagonal (ports & adapters) architecture.
 * 
 * Grafted from:
 * - domain-driven-hexagon (14.7k★)
 * - library-hexagonal (279★)
 * 
 * Pattern: Ports and Adapters (Clean Architecture)
 */

class HexagonalGenerator {
  constructor(options = {}) {
    this.options = options;
    this.templates = this.initializeTemplates();
  }

  /**
   * Initialize code templates
   */
  initializeTemplates() {
    return {
      // Domain Layer (Inner Hexagon)
      entity: (name, fields) => `/**
 * ${name} Entity - Domain Layer
 * Core business object with behavior
 */
class ${name} {
  constructor(id, ${fields.map(f => f.name).join(', ')}) {
    this.id = id;
${fields.map(f => `    this.${f.name} = ${f.name};`).join('\n')}
    this.createdAt = new Date();
  }

  // Domain behavior methods
${fields.filter(f => f.behavior).map(f => `  ${f.behavior}(value) {
    // Business logic here
    this.${f.name} = value;
    return this;
  }`).join('\n\n')}

  // Validation
  validate() {
    const errors = [];
${fields.filter(f => f.required).map(f => `    if (!this.${f.name}) {
      errors.push('${f.name} is required');
    }`).join('\n')}
    return errors;
  }

  // Domain events
  toEvent(type) {
    return {
      type: '${name}' + type,
      payload: this.toJSON(),
      timestamp: new Date()
    };
  }

  toJSON() {
    return {
      id: this.id,
${fields.map(f => `      ${f.name}: this.${f.name}`).join(',\n')},
      createdAt: this.createdAt
    };
  }
}

module.exports = ${name};`,

      valueObject: (name, fields) => `/**
 * ${name} Value Object - Domain Layer
 * Immutable, identity-free object
 */
class ${name} {
  constructor(${fields.map(f => f.name).join(', ')}) {
${fields.map(f => `    this.${f.name} = ${f.name};`).join('\n')}
    
    // Validate on creation
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error('Invalid ${name}: ' + errors.join(', '));
    }
    
    // Freeze for immutability
    Object.freeze(this);
  }

  validate() {
    const errors = [];
${fields.filter(f => f.required).map(f => `    if (this.${f.name} === null || this.${f.name} === undefined) {
      errors.push('${f.name} is required');
    }`).join('\n')}
    return errors;
  }

  // Equality based on values, not identity
  equals(other) {
    if (!(other instanceof ${name})) return false;
${fields.map(f => `    if (this.${f.name} !== other.${f.name}) return false;`).join('\n')}
    return true;
  }

  toJSON() {
    return {
${fields.map(f => `      ${f.name}: this.${f.name}`).join(',\n')}
    };
  }
}

module.exports = ${name};`,

      repository: (name) => `/**
 * ${name} Repository Port - Domain Layer
 * Abstract interface for data access
 */
class ${name}Repository {
  // Port interface - implemented by adapters
  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findAll(query) {
    throw new Error('Method not implemented');
  }

  async save(entity) {
    throw new Error('Method not implemented');
  }

  async update(id, entity) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async exists(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = ${name}Repository;`,

      // Application Layer (Middle Hexagon)
      useCase: (name, action, entity) => `/**
 * ${action}${name} Use Case - Application Layer
 * Orchestrates domain logic for specific operation
 */
class ${action}${name}UseCase {
  constructor(${name.toLowerCase()}Repository, eventBus) {
    this.repository = ${name.toLowerCase()}Repository;
    this.eventBus = eventBus;
  }

  async execute(command) {
    try {
      // Validate command
      const validationErrors = this.validate(command);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }

      // Execute business logic
      const result = await this.performAction(command);

      // Publish domain event
      if (result.success && result.entity) {
        await this.eventBus.publish(result.entity.toEvent('${action}d'));
      }

      return result;
    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  validate(command) {
    const errors = [];
    // Add validation logic here
    return errors;
  }

  async performAction(command) {
    // Override in specific use case
    throw new Error('Method not implemented');
  }
}

module.exports = ${action}${name}UseCase;`,

      // Infrastructure Layer (Outer Hexagon - Adapters)
      databaseAdapter: (name) => `/**
 * ${name} Database Adapter - Infrastructure Layer
 * Implements repository port with concrete database
 */
const ${name}Repository = require('../../domain/ports/${name.toLowerCase()}.repository');

class ${name}DatabaseAdapter extends ${name}Repository {
  constructor(database) {
    super();
    this.db = database;
    this.collection = '${name.toLowerCase()}s';
  }

  async findById(id) {
    const data = await this.db.collection(this.collection).findOne({ id });
    return data ? this.toEntity(data) : null;
  }

  async findAll(query = {}) {
    const data = await this.db.collection(this.collection).find(query).toArray();
    return data.map(d => this.toEntity(d));
  }

  async save(entity) {
    const data = entity.toJSON();
    await this.db.collection(this.collection).insertOne(data);
    return entity;
  }

  async update(id, entity) {
    const data = entity.toJSON();
    await this.db.collection(this.collection).updateOne(
      { id },
      { $set: data }
    );
    return entity;
  }

  async delete(id) {
    await this.db.collection(this.collection).deleteOne({ id });
    return true;
  }

  async exists(id) {
    const count = await this.db.collection(this.collection).countDocuments({ id });
    return count > 0;
  }

  toEntity(data) {
    // Convert database record to domain entity
    const Entity = require('../../domain/entities/${name.toLowerCase()}');
    return new Entity(data.id, /* other fields */);
  }
}

module.exports = ${name}DatabaseAdapter;`,

      httpAdapter: (name, actions) => `/**
 * ${name} HTTP Adapter - Infrastructure Layer
 * REST API controller implementing input port
 */
const express = require('express');

class ${name}HttpAdapter {
  constructor(useCases) {
    this.router = express.Router();
    this.useCases = useCases;
    this.setupRoutes();
  }

  setupRoutes() {
${actions.map(action => `
    this.router.${action.method}('${action.path}', async (req, res) => {
      try {
        const command = this.createCommand(req, '${action.name}');
        const result = await this.useCases.${action.name}.execute(command);
        
        if (result.success) {
          res.status(${action.successCode || 200}).json(result);
        } else {
          res.status(400).json({ errors: result.errors });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });`).join('\n')}
  }

  createCommand(req, action) {
    return {
      ...req.body,
      ...req.params,
      ...req.query
    };
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ${name}HttpAdapter;`,

      // Main Application Setup
      main: (name) => `/**
 * Application Bootstrap - Composition Root
 * Wire up all adapters and start application
 */
const express = require('express');
const ${name}DatabaseAdapter = require('./infrastructure/adapters/${name.toLowerCase()}.db.adapter');
const ${name}HttpAdapter = require('./infrastructure/adapters/${name.toLowerCase()}.http.adapter');
const Create${name}UseCase = require('./application/use-cases/create-${name.toLowerCase()}.usecase');
const Update${name}UseCase = require('./application/use-cases/update-${name.toLowerCase()}.usecase');
const Get${name}UseCase = require('./application/use-cases/get-${name.toLowerCase()}.usecase');
const EventBus = require('./infrastructure/event-bus');

async function bootstrap() {
  const app = express();
  app.use(express.json());

  // Infrastructure
  const database = await connectDatabase();
  const eventBus = new EventBus();

  // Adapters (Outer Hexagon)
  const repository = new ${name}DatabaseAdapter(database);

  // Use Cases (Application Layer)
  const useCases = {
    create: new Create${name}UseCase(repository, eventBus),
    update: new Update${name}UseCase(repository, eventBus),
    get: new Get${name}UseCase(repository, eventBus)
  };

  // HTTP Adapter (Primary Adapter)
  const httpAdapter = new ${name}HttpAdapter(useCases);
  app.use('/api/${name.toLowerCase()}s', httpAdapter.getRouter());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: '${name}' });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('🏗️  ${name} Service running on port ' + PORT);
    console.log('Architecture: Hexagonal (Ports & Adapters)');
  });

  return app;
}

bootstrap().catch(console.error);

async function connectDatabase() {
  // Database connection logic
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  return client.db(process.env.DB_NAME);
}

module.exports = bootstrap;`
    };
  }

  /**
   * Generate complete hexagonal architecture
   */
  generate(config) {
    const { name, domain, application, infrastructure } = config;
    
    console.log('🏗️  Generating Hexagonal Architecture:', name);
    
    const files = [];

    // Generate Domain Layer (Inner Hexagon)
    if (domain) {
      console.log('  📐 Generating Domain Layer...');
      
      // Entities
      domain.entities?.forEach(entity => {
        files.push({
          path: `domain/entities/${entity.name.toLowerCase()}.js`,
          content: this.templates.entity(entity.name, entity.fields)
        });
      });

      // Value Objects
      domain.valueObjects?.forEach(vo => {
        files.push({
          path: `domain/value-objects/${vo.name.toLowerCase()}.js`,
          content: this.templates.valueObject(vo.name, vo.fields)
        });
      });

      // Repository Port (Interface)
      files.push({
        path: `domain/ports/${name.toLowerCase()}.repository.js`,
        content: this.templates.repository(name)
      });
    }

    // Generate Application Layer (Middle Hexagon)
    if (application) {
      console.log('  📋 Generating Application Layer...');
      
      application.useCases?.forEach(useCase => {
        files.push({
          path: `application/use-cases/${useCase.action.toLowerCase()}-${name.toLowerCase()}.usecase.js`,
          content: this.templates.useCase(name, useCase.action, name)
        });
      });
    }

    // Generate Infrastructure Layer (Outer Hexagon)
    if (infrastructure) {
      console.log('  🔌 Generating Infrastructure Layer...');

      // Database Adapter
      if (infrastructure.database) {
        files.push({
          path: `infrastructure/adapters/${name.toLowerCase()}.db.adapter.js`,
          content: this.templates.databaseAdapter(name)
        });
      }

      // HTTP Adapter
      if (infrastructure.http) {
        files.push({
          path: `infrastructure/adapters/${name.toLowerCase()}.http.adapter.js`,
          content: this.templates.httpAdapter(name, infrastructure.http.routes || [])
        });
      }
    }

    // Main application bootstrap
    files.push({
      path: 'app.js',
      content: this.templates.main(name)
    });

    // Package.json
    files.push({
      path: 'package.json',
      content: JSON.stringify({
        name: name.toLowerCase() + '-service',
        version: '1.0.0',
        description: name + ' Service - Hexagonal Architecture',
        main: 'app.js',
        scripts: {
          start: 'node app.js',
          dev: 'nodemon app.js',
          test: 'jest'
        },
        dependencies: {
          express: '^4.18.2',
          mongodb: '^5.0.0'
        },
        devDependencies: {
          nodemon: '^3.0.0',
          jest: '^29.0.0'
        },
        keywords: ['hexagonal', 'ddd', 'clean-architecture', name.toLowerCase()]
      }, null, 2)
    });

    console.log('  ✅ Generated', files.length, 'files');
    console.log('');

    return {
      architecture: 'hexagonal',
      name: name,
      files: files,
      structure: this.getStructure(name),
      nextSteps: [
        'Install dependencies: npm install',
        'Set environment variables (MONGODB_URI, DB_NAME)',
        'Run: npm start',
        'Test API at http://localhost:3000/api/' + name.toLowerCase() + 's'
      ]
    };
  }

  /**
   * Get architecture structure
   */
  getStructure(name) {
    return `
${name}Service/
├── app.js                    # Application bootstrap
├── package.json
├── domain/                   # Inner Hexagon - Core Business Logic
│   ├── entities/            # Domain entities
│   ├── value-objects/       # Value objects
│   └── ports/               # Repository interfaces
├── application/             # Middle Hexagon - Use Cases
│   └── use-cases/          # Application services
└── infrastructure/          # Outer Hexagon - Adapters
    └── adapters/           # Concrete implementations
        ├── ${name.toLowerCase()}.db.adapter.js
        └── ${name.toLowerCase()}.http.adapter.js

Dependencies flow inward:
Infrastructure → Application → Domain (no reverse dependencies)
`;
  }

  /**
   * Validate hexagonal architecture
   */
  validate(files) {
    const errors = [];
    
    // Check domain doesn't depend on infrastructure
    const domainFiles = files.filter(f => f.path.includes('domain/'));
    domainFiles.forEach(file => {
      if (file.content.includes('require(') && 
          (file.content.includes('express') || file.content.includes('mongodb'))) {
        errors.push({
          file: file.path,
          error: 'Domain layer depends on infrastructure (Express/MongoDB)'
        });
      }
    });

    // Check dependency direction
    const appFiles = files.filter(f => f.path.includes('application/'));
    appFiles.forEach(file => {
      if (file.content.includes('express') || file.content.includes('mongodb')) {
        errors.push({
          file: file.path,
          error: 'Application layer depends on infrastructure'
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = HexagonalGenerator;

// CLI demo
if (require.main === module) {
  const generator = new HexagonalGenerator();
  
  const result = generator.generate({
    name: 'Order',
    domain: {
      entities: [
        {
          name: 'Order',
          fields: [
            { name: 'customerId', required: true },
            { name: 'items', required: true },
            { name: 'totalAmount', required: true, behavior: 'updateTotal' }
          ]
        }
      ]
    },
    application: {
      useCases: [
        { action: 'Create' },
        { action: 'Update' },
        { action: 'Get' }
      ]
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

  console.log('Generated Files:');
  result.files.forEach(f => console.log('  -', f.path));
  console.log('');
  console.log('Structure:');
  console.log(result.structure);
  console.log('Next Steps:');
  result.nextSteps.forEach(s => console.log('  -', s));
}
