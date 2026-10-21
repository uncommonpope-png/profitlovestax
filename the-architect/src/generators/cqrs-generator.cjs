/**
 * CQRS (Command Query Responsibility Segregation) Generator v1.0.0
 * 
 * Generates CQRS pattern implementation:
 * - Separate command and query models
 * - Event sourcing support
 * - Read model projections
 * 
 * Grafted from:
 * - EquinoxProject (6.8k★)
 * - ddd-hexagonal-cqrs-es-eda (1.4k★)
 */

class CQRSGenerator {
  constructor() {
    this.templates = this.initializeTemplates();
  }

  initializeTemplates() {
    return {
      // Command Handler
      commandHandler: (aggregate) => `/**
 * ${aggregate} Command Handler
 * Processes commands and updates write model
 */
class ${aggregate}CommandHandler {
  constructor(repository, eventBus) {
    this.repository = repository;
    this.eventBus = eventBus;
  }

  async handle(command) {
    switch (command.type) {
      case 'Create${aggregate}':
        return await this.handleCreate(command);
      case 'Update${aggregate}':
        return await this.handleUpdate(command);
      case 'Delete${aggregate}':
        return await this.handleDelete(command);
      default:
        throw new Error('Unknown command type: ' + command.type);
    }
  }

  async handleCreate(command) {
    const Aggregate = require('../../domain/aggregates/${aggregate.toLowerCase()}.aggregate');
    const aggregate = Aggregate.create(command.id, command.payload);
    
    await this.repository.save(aggregate);
    
    // Publish events
    for (const event of aggregate.domainEvents) {
      await this.eventBus.publish(event);
    }
    
    return {
      success: true,
      aggregateId: aggregate.id
    };
  }

  async handleUpdate(command) {
    const aggregate = await this.repository.findById(command.id);
    if (!aggregate) {
      throw new Error('${aggregate} not found');
    }

    // Apply updates
    aggregate.update(command.payload);
    
    await this.repository.save(aggregate);
    
    // Publish events
    for (const event of aggregate.domainEvents) {
      await this.eventBus.publish(event);
    }
    
    return {
      success: true,
      aggregateId: aggregate.id
    };
  }

  async handleDelete(command) {
    const aggregate = await this.repository.findById(command.id);
    if (!aggregate) {
      throw new Error('${aggregate} not found');
    }

    aggregate.markAsDeleted();
    
    await this.repository.save(aggregate);
    
    return {
      success: true,
      aggregateId: aggregate.id
    };
  }
}

module.exports = ${aggregate}CommandHandler;`,

      // Query Handler
      queryHandler: (model) => `/**
 * ${model} Query Handler
 * Processes queries against read model
 */
class ${model}QueryHandler {
  constructor(readModelRepository) {
    this.repository = readModelRepository;
  }

  async handle(query) {
    switch (query.type) {
      case 'Get${model}ById':
        return await this.handleGetById(query);
      case 'GetAll${model}s':
        return await this.handleGetAll(query);
      case 'Search${model}s':
        return await this.handleSearch(query);
      default:
        throw new Error('Unknown query type: ' + query.type);
    }
  }

  async handleGetById(query) {
    const result = await this.repository.findById(query.id);
    return {
      success: true,
      data: result
    };
  }

  async handleGetAll(query) {
    const results = await this.repository.findAll({
      skip: query.skip || 0,
      limit: query.limit || 10
    });
    
    return {
      success: true,
      data: results.items,
      total: results.total
    };
  }

  async handleSearch(query) {
    const results = await this.repository.search(query.criteria, {
      skip: query.skip || 0,
      limit: query.limit || 10
    });
    
    return {
      success: true,
      data: results.items,
      total: results.total
    };
  }
}

module.exports = ${model}QueryHandler;`,

      // Read Model Projector
      projector: (aggregate, readModel) => `/**
 * ${readModel} Projector
 * Projects domain events to read model
 */
class ${readModel}Projector {
  constructor(readModelRepository) {
    this.repository = readModelRepository;
  }

  async project(event) {
    switch (event.type) {
      case '${aggregate}Created':
        return await this.handleCreated(event);
      case '${aggregate}Updated':
        return await this.handleUpdated(event);
      case '${aggregate}Deleted':
        return await this.handleDeleted(event);
      default:
        // Ignore unknown events
        return;
    }
  }

  async handleCreated(event) {
    const readModel = {
      id: event.aggregateId,
      ...event.payload,
      createdAt: event.metadata.timestamp,
      updatedAt: event.metadata.timestamp
    };
    
    await this.repository.insert(readModel);
  }

  async handleUpdated(event) {
    const existing = await this.repository.findById(event.aggregateId);
    if (!existing) {
      console.warn('Read model not found for update:', event.aggregateId);
      return;
    }
    
    const updated = {
      ...existing,
      ...event.payload,
      updatedAt: event.metadata.timestamp
    };
    
    await this.repository.update(event.aggregateId, updated);
  }

  async handleDeleted(event) {
    await this.repository.delete(event.aggregateId);
  }
}

module.exports = ${readModel}Projector;`,

      // Read Model Repository
      readRepository: (model) => `/**
 * ${model} Read Model Repository
 * Optimized for queries
 */
class ${model}ReadRepository {
  constructor(database) {
    this.db = database;
    this.collection = '${model.toLowerCase()}ReadModels';
  }

  async findById(id) {
    return await this.db.collection(this.collection).findOne({ id });
  }

  async findAll(options = {}) {
    const { skip = 0, limit = 10 } = options;
    
    const [items, total] = await Promise.all([
      this.db.collection(this.collection)
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.db.collection(this.collection).countDocuments({})
    ]);
    
    return { items, total };
  }

  async search(criteria, options = {}) {
    const { skip = 0, limit = 10 } = options;
    
    const query = this.buildQuery(criteria);
    
    const [items, total] = await Promise.all([
      this.db.collection(this.collection)
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.db.collection(this.collection).countDocuments(query)
    ]);
    
    return { items, total };
  }

  buildQuery(criteria) {
    const query = {};
    
    if (criteria.text) {
      query.$text = { $search: criteria.text };
    }
    
    if (criteria.filters) {
      Object.assign(query, criteria.filters);
    }
    
    return query;
  }

  async insert(model) {
    await this.db.collection(this.collection).insertOne(model);
  }

  async update(id, model) {
    await this.db.collection(this.collection).updateOne(
      { id },
      { $set: model }
    );
  }

  async delete(id) {
    await this.db.collection(this.collection).deleteOne({ id });
  }
}

module.exports = ${model}ReadRepository;`,

      // Event Store
      eventStore: () => `/**
 * Event Store
 * Append-only storage for domain events
 */
class EventStore {
  constructor(database) {
    this.db = database;
    this.collection = 'events';
  }

  async append(event) {
    const eventRecord = {
      id: event.id,
      aggregateId: event.aggregateId,
      type: event.type,
      payload: event.payload,
      metadata: event.metadata,
      version: await this.getNextVersion(event.aggregateId),
      timestamp: new Date()
    };
    
    await this.db.collection(this.collection).insertOne(eventRecord);
    
    return eventRecord;
  }

  async getEvents(aggregateId, fromVersion = 0) {
    return await this.db.collection(this.collection)
      .find({
        aggregateId,
        version: { $gte: fromVersion }
      })
      .sort({ version: 1 })
      .toArray();
  }

  async getNextVersion(aggregateId) {
    const lastEvent = await this.db.collection(this.collection)
      .findOne(
        { aggregateId },
        { sort: { version: -1 } }
      );
    
    return lastEvent ? lastEvent.version + 1 : 0;
  }

  async getAllEvents(since = null) {
    const query = since ? { timestamp: { $gt: since } } : {};
    
    return await this.db.collection(this.collection)
      .find(query)
      .sort({ timestamp: 1 })
      .toArray();
  }
}

module.exports = EventStore;`
    };
  }

  generate(config) {
    const { aggregate, readModel } = config;
    const files = [];

    console.log('📊 Generating CQRS Pattern...');

    // Command Side (Write Model)
    console.log('  ✏️  Generating Command Side...');
    files.push({
      path: `application/commands/${aggregate.toLowerCase()}.command.handler.js`,
      content: this.templates.commandHandler(aggregate)
    });

    // Query Side (Read Model)
    console.log('  📖 Generating Query Side...');
    files.push({
      path: `application/queries/${readModel.toLowerCase()}.query.handler.js`,
      content: this.templates.queryHandler(readModel)
    });

    // Projector
    console.log('  🔄 Generating Projector...');
    files.push({
      path: `application/projections/${readModel.toLowerCase()}.projector.js`,
      content: this.templates.projector(aggregate, readModel)
    });

    // Read Model Repository
    files.push({
      path: `infrastructure/persistence/${readModel.toLowerCase()}.read.repository.js`,
      content: this.templates.readRepository(readModel)
    });

    // Event Store
    console.log('  📦 Generating Event Store...');
    files.push({
      path: 'infrastructure/persistence/event.store.js',
      content: this.templates.eventStore()
    });

    console.log('  ✅ Generated', files.length, 'CQRS files');

    return {
      pattern: 'cqrs',
      files: files,
      concepts: [
        'Commands - Modify state (Write Model)',
        'Queries - Read state (Read Model)',
        'Event Sourcing - State as events',
        'Projections - Build read models from events',
        'Separation - Different models for different purposes'
      ],
      benefits: [
        'Independent scaling of read/write',
        'Optimized data models for each use case',
        'Event sourcing enables temporal queries',
        'Better performance for complex queries'
      ]
    };
  }
}

module.exports = CQRSGenerator;
