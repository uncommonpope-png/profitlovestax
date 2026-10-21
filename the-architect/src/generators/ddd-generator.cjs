/**
 * DDD (Domain-Driven Design) Generator v1.0.0
 * 
 * Generates complete DDD tactical patterns:
 * - Aggregates
 * - Entities  
 * - Value Objects
 * - Domain Services
 * - Domain Events
 * 
 * Grafted from:
 * - modular-monolith-ddd (13.7k★)
 * - ddd-by-examples/library (5.8k★)
 */

class DDDGenerator {
  constructor() {
    this.templates = this.initializeTemplates();
  }

  initializeTemplates() {
    return {
      // Aggregate Root
      aggregate: (name, entities) => `/**
 * ${name} Aggregate Root
 * Consistency boundary for the ${name} domain
 */
const AggregateRoot = require('./aggregate-root.base');
${entities.map(e => `const ${e} = require('../entities/${e.toLowerCase()}');`).join('\n')}

class ${name}Aggregate extends AggregateRoot {
  constructor(id) {
    super(id);
    this._entities = new Map();
    this._version = 0;
  }

  // Factory method
  static create(id, data) {
    const aggregate = new ${name}Aggregate(id);
    aggregate.apply(new ${name}CreatedEvent(id, data));
    return aggregate;
  }

  // Business invariants
  ensureInvariants() {
    // Check aggregate consistency rules
    if (this._entities.size === 0) {
      throw new Error('${name} must have at least one entity');
    }
  }

  // Add entity to aggregate
  addEntity(entity) {
    this._entities.set(entity.id, entity);
    this.ensureInvariants();
    this.apply(new EntityAddedTo${name}Event(this.id, entity));
  }

  // Remove entity from aggregate
  removeEntity(entityId) {
    if (!this._entities.has(entityId)) {
      throw new Error('Entity not found in aggregate');
    }
    this._entities.delete(entityId);
    this.ensureInvariants();
    this.apply(new EntityRemovedFrom${name}Event(this.id, entityId));
  }

  // Get entity from aggregate
  getEntity(entityId) {
    return this._entities.get(entityId);
  }

  // Get all entities
  getEntities() {
    return Array.from(this._entities.values());
  }

  // Apply domain event
  apply(event) {
    super.apply(event);
    this._version++;
  }

  // Rehydrate from events
  static rehydrate(id, events) {
    const aggregate = new ${name}Aggregate(id);
    events.forEach(event => aggregate.apply(event));
    return aggregate;
  }

  toJSON() {
    return {
      id: this.id,
      version: this._version,
      entities: this.getEntities().map(e => e.toJSON()),
      domainEvents: this.domainEvents.map(e => e.toJSON())
    };
  }
}

module.exports = ${name}Aggregate;`,

      // Domain Service
      domainService: (name, domain) => `/**
 * ${name} Domain Service
 * Stateless business logic that doesn't belong to an entity
 */
class ${name}DomainService {
  constructor(repository, eventBus) {
    this.repository = repository;
    this.eventBus = eventBus;
  }

  /**
   * Core domain operation
   */
  async performOperation(aggregateId, data) {
    // Load aggregate
    const aggregate = await this.repository.findById(aggregateId);
    if (!aggregate) {
      throw new Error('Aggregate not found');
    }

    // Perform domain logic
    const result = await this.executeBusinessLogic(aggregate, data);

    // Save changes
    await this.repository.save(aggregate);

    // Publish domain events
    for (const event of aggregate.domainEvents) {
      await this.eventBus.publish(event);
    }

    // Clear events from aggregate
    aggregate.clearEvents();

    return result;
  }

  /**
   * Business logic implementation
   */
  async executeBusinessLogic(aggregate, data) {
    // Override in specific service
    throw new Error('Method not implemented');
  }

  /**
   * Validate business rules
   */
  validateBusinessRules(aggregate, data) {
    const violations = [];
    
    // Add validation logic
    
    if (violations.length > 0) {
      throw new BusinessRuleViolationException(violations);
    }
  }
}

module.exports = ${name}DomainService;`,

      // Domain Event
      domainEvent: (name, data) => `/**
 * ${name} Domain Event
 * Represents something that happened in the domain
 */
class ${name}Event {
  constructor(aggregateId, payload, metadata = {}) {
    this.id = this.generateId();
    this.aggregateId = aggregateId;
    this.type = '${name}';
    this.payload = payload;
    this.metadata = {
      timestamp: new Date(),
      correlationId: metadata.correlationId || this.generateId(),
      causationId: metadata.causationId || null,
      ...metadata
    };
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  toJSON() {
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      type: this.type,
      payload: this.payload,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new ${name}Event(json.aggregateId, json.payload, json.metadata);
  }
}

module.exports = ${name}Event;`,

      // Repository
      repository: (aggregate) => `/**
 * ${aggregate} Repository
 * Persistence for aggregate roots
 */
class ${aggregate}Repository {
  constructor(eventStore, snapshotStore) {
    this.eventStore = eventStore;
    this.snapshotStore = snapshotStore;
  }

  /**
   * Find aggregate by ID
   */
  async findById(id) {
    // Try to get snapshot first
    const snapshot = await this.snapshotStore.get(id);
    
    // Get events after snapshot
    const fromVersion = snapshot ? snapshot.version : 0;
    const events = await this.eventStore.getEvents(id, fromVersion);
    
    if (!snapshot && events.length === 0) {
      return null;
    }

    // Rehydrate aggregate
    const Aggregate = require('../aggregates/${aggregate.toLowerCase()}.aggregate');
    const aggregate = snapshot 
      ? Aggregate.fromSnapshot(snapshot)
      : new Aggregate(id);
    
    events.forEach(event => aggregate.apply(event));
    
    return aggregate;
  }

  /**
   * Save aggregate
   */
  async save(aggregate) {
    // Append events to event store
    for (const event of aggregate.domainEvents) {
      await this.eventStore.append(event);
    }

    // Clear events from aggregate
    aggregate.clearEvents();

    // Create snapshot every N events
    if (aggregate.version % 10 === 0) {
      await this.snapshotStore.save(aggregate);
    }
  }
}

module.exports = ${aggregate}Repository;`,

      // Specification Pattern
      specification: (name, criteria) => `/**
 * ${name} Specification
 * Encapsulates business rules for selecting entities
 */
class ${name}Specification {
  constructor(${Object.keys(criteria).join(', ')}) {
${Object.keys(criteria).map(key => `    this.${key} = ${key};`).join('\n')}
  }

  /**
   * Check if entity satisfies specification
   */
  isSatisfiedBy(entity) {
${Object.entries(criteria).map(([key, condition]) => `    if (!${condition}) return false;`).join('\n')}
    return true;
  }

  /**
   * Convert to query for repository
   */
  toQuery() {
    return {
${Object.keys(criteria).map(key => `      ${key}: this.${key}`).join(',\n')}
    };
  }

  /**
   * Combine with AND
   */
  and(other) {
    return new AndSpecification(this, other);
  }

  /**
   * Combine with OR
   */
  or(other) {
    return new OrSpecification(this, other);
  }

  /**
   * Negate
   */
  not() {
    return new NotSpecification(this);
  }
}

module.exports = ${name}Specification;`
    };
  }

  /**
   * Generate complete DDD structure
   */
  generate(config) {
    const { domain, aggregates, services } = config;
    const files = [];

    console.log('📐 Generating DDD Tactical Patterns...');

    // Generate Aggregates
    if (aggregates) {
      console.log('  🏛️  Generating Aggregates...');
      aggregates.forEach(agg => {
        files.push({
          path: `domain/aggregates/${agg.name.toLowerCase()}.aggregate.js`,
          content: this.templates.aggregate(agg.name, agg.entities || [])
        });

        // Generate repository for aggregate
        files.push({
          path: `domain/repositories/${agg.name.toLowerCase()}.repository.js`,
          content: this.templates.repository(agg.name)
        });
      });
    }

    // Generate Domain Services
    if (services) {
      console.log('  ⚙️  Generating Domain Services...');
      services.forEach(service => {
        files.push({
          path: `domain/services/${service.name.toLowerCase()}.service.js`,
          content: this.templates.domainService(service.name, domain)
        });
      });
    }

    // Generate Domain Events
    if (config.events) {
      console.log('  📢 Generating Domain Events...');
      config.events.forEach(event => {
        files.push({
          path: `domain/events/${event.name.toLowerCase()}.event.js`,
          content: this.templates.domainEvent(event.name, event.data || {})
        });
      });
    }

    // Generate Specifications
    if (config.specifications) {
      console.log('  🔍 Generating Specifications...');
      config.specifications.forEach(spec => {
        files.push({
          path: `domain/specifications/${spec.name.toLowerCase()}.spec.js`,
          content: this.templates.specification(spec.name, spec.criteria || {})
        });
      });
    }

    console.log('  ✅ Generated', files.length, 'DDD files');

    return {
      pattern: 'ddd',
      files: files,
      structure: this.getStructure(),
      concepts: [
        'Aggregates - Consistency boundaries',
        'Domain Services - Stateless business logic',
        'Domain Events - What happened in the domain',
        'Specifications - Encapsulated query criteria',
        'Repositories - Aggregate persistence'
      ]
    };
  }

  getStructure() {
    return `
domain/
├── aggregates/          # Aggregate roots
│   └── order.aggregate.js
├── entities/           # Domain entities
├── value-objects/      # Value objects
├── repositories/       # Repository interfaces
├── services/          # Domain services
├── events/            # Domain events
└── specifications/    # Query specifications

Key DDD Concepts:
- Aggregate: Consistency boundary
- Entity: Identity + behavior
- Value Object: Immutable, no identity
- Domain Service: Stateless logic
- Domain Event: Immutable record of fact
- Repository: Aggregate persistence
- Specification: Encapsulated query
`;
  }
}

module.exports = DDDGenerator;
