/**
 * Power: RAG
 * Retrieval-Augmented Generation for architecture patterns.
 * Maintains a knowledge base of patterns and answers queries.
 *
 * When to use: The user asks questions about architecture patterns,
 *   wants grounded recommendations, or needs pattern documentation.
 */

const fs = require('fs');
const path = require('path');

class PowerRAG {
  constructor(options = {}) {
    this.knowledgeDir = options.knowledgeDir || path.join(process.cwd(), '.architect-knowledge');
    this.documents = new Map();
    this.ensureDir();
    this.seedKnowledge();
  }

  ensureDir() {
    if (!fs.existsSync(this.knowledgeDir)) {
      fs.mkdirSync(this.knowledgeDir, { recursive: true });
    }
  }

  seedKnowledge() {
    const patterns = [
      {
        id: 'hexagonal',
        title: 'Hexagonal Architecture',
        content: 'Hexagonal architecture, also known as ports and adapters, places the domain at the center. Dependencies point inward. Infrastructure is on the outside.',
        tags: ['hexagonal', 'ports', 'adapters', 'clean']
      },
      {
        id: 'ddd',
        title: 'Domain-Driven Design',
        content: 'DDD models complex domains using ubiquitous language, bounded contexts, aggregates, entities, value objects, and domain services.',
        tags: ['ddd', 'domain', 'bounded-context', 'aggregate']
      },
      {
        id: 'cqrs',
        title: 'CQRS',
        content: 'Command Query Responsibility Segregation separates read and write models to optimize each independently. Often paired with event sourcing.',
        tags: ['cqrs', 'read-model', 'write-model', 'event-sourcing']
      },
      {
        id: 'nestjs',
        title: 'NestJS',
        content: 'NestJS is a progressive Node.js framework using decorators, dependency injection, modules, controllers, and providers for enterprise architecture.',
        tags: ['nestjs', 'typescript', 'decorators', 'di']
      },
      {
        id: 'xstate',
        title: 'XState',
        content: 'XState implements statecharts and finite state machines with actors, actions, guards, and event-driven orchestration.',
        tags: ['xstate', 'state-machine', 'statechart', 'actor']
      }
    ];

    for (const doc of patterns) {
      this.documents.set(doc.id, doc);
      const filePath = path.join(this.knowledgeDir, doc.id + '.json');
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(doc, null, 2));
      }
    }
  }

  status() {
    return {
      ready: true,
      documents: this.documents.size
    };
  }

  execute(mission) {
    const action = mission.action || 'query';

    try {
      switch (action) {
        case 'ingest': {
          const doc = {
            id: mission.id || 'doc_' + Date.now(),
            title: mission.title || 'Untitled',
            content: mission.content || '',
            tags: mission.tags || [],
            source: mission.source || 'unknown'
          };
          this.documents.set(doc.id, doc);
          fs.writeFileSync(
            path.join(this.knowledgeDir, doc.id + '.json'),
            JSON.stringify(doc, null, 2)
          );
          return { output: { ingested: true, id: doc.id } };
        }
        case 'query': {
          const query = (mission.query || '').toLowerCase();
          const results = [];
          for (const doc of this.documents.values()) {
            const text = (doc.title + ' ' + doc.content + ' ' + doc.tags.join(' ')).toLowerCase();
            if (text.includes(query)) {
              results.push(doc);
            }
          }
          // Also search disk
          const files = fs.readdirSync(this.knowledgeDir).filter(f => f.endsWith('.json'));
          for (const file of files) {
            try {
              const data = JSON.parse(fs.readFileSync(path.join(this.knowledgeDir, file), 'utf8'));
              if (!this.documents.has(data.id)) {
                const text = (data.title + ' ' + data.content + ' ' + (data.tags || []).join(' ')).toLowerCase();
                if (text.includes(query)) results.push(data);
              }
            } catch {}
          }
          return {
            output: {
              query,
              results: results.slice(0, mission.top_k || 5),
              total: results.length
            }
          };
        }
        default:
          return {
            error: `Unknown RAG action: ${action}. Available: ingest, query`
          };
      }
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}

module.exports = PowerRAG;
