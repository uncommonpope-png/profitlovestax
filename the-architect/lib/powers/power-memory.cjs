/**
 * Power: MEMORY
 * Pattern memory storage with semantic indexing.
 * Stores and retrieves architecture patterns, decisions, and designs.
 *
 * When to use: The user wants to remember, recall, or search
 *   previously stored architecture knowledge.
 */

const fs = require('fs');
const path = require('path');

class PowerMemory {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(process.cwd(), '.architect-memory');
    this.memories = new Map();
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  status() {
    return {
      ready: true,
      memories: this.memories.size,
      baseDir: this.baseDir
    };
  }

  execute(mission) {
    const action = mission.action || 'add';

    try {
      switch (action) {
        case 'add': {
          const id = mission.id || 'mem_' + Date.now();
          const entry = {
            id,
            content: mission.content || '',
            tags: mission.tags || [],
            timestamp: new Date().toISOString(),
            metadata: mission.metadata || {}
          };
          this.memories.set(id, entry);
          fs.writeFileSync(
            path.join(this.baseDir, id + '.json'),
            JSON.stringify(entry, null, 2)
          );
          return { output: { added: true, id } };
        }
        case 'query': {
          const query = (mission.query || '').toLowerCase();
          const results = [];
          for (const [id, mem] of this.memories) {
            const text = (mem.content + ' ' + mem.tags.join(' ')).toLowerCase();
            if (text.includes(query)) {
              results.push(mem);
            }
          }
          // Also search files on disk
          if (fs.existsSync(this.baseDir)) {
            const files = fs.readdirSync(this.baseDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
              const filePath = path.join(this.baseDir, file);
              try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const text = (data.content + ' ' + (data.tags || []).join(' ')).toLowerCase();
                if (text.includes(query) && !this.memories.has(data.id)) {
                  results.push(data);
                }
              } catch {}
            }
          }
          return {
            output: {
              query,
              results: results.slice(0, mission.top_k || 5),
              total: results.length
            }
          };
        }
        case 'recall': {
          const id = mission.id;
          let mem = this.memories.get(id);
          if (!mem) {
            const filePath = path.join(this.baseDir, id + '.json');
            if (fs.existsSync(filePath)) {
              mem = JSON.parse(fs.readFileSync(filePath, 'utf8'));
              this.memories.set(id, mem);
            }
          }
          return {
            output: { found: !!mem, memory: mem || null }
          };
        }
        case 'list': {
          const ids = Array.from(this.memories.keys());
          return { output: { total: ids.length, ids: ids.slice(0, mission.limit || 50) } };
        }
        default:
          return {
            error: `Unknown memory action: ${action}. Available: add, query, recall, list`
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

module.exports = PowerMemory;
