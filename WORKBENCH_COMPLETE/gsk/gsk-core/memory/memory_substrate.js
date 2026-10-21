'use strict';

/**
 * MemorySubstrate — Unified memory interface (Hermes parity)
 *
 * Unifies: SCRIBE (witness) + Seshat (knowledge) + consciousness-researcher + soul-journal + knowledge-graph
 * Single interface: store, retrieve, associate, synthesize, forget
 * All chambers/brain modules use substrate, not direct file access
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MemorySubstrate {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.dataDir = options.dataDir || path.join(__dirname, '../../data/memory_substrate');

        // Backend connections
        this.scribe = kernel.scribe || kernel.systems?.scribe;
        this.seshat = kernel.seshat || kernel.systems?.seshat;
        this.consciousnessResearcher = kernel.consciousness?.researcher;
        this.soulJournal = kernel.consciousness?.soulJournal;
        this.knowledgeGraph = kernel.systems?.knowledgeGraph;
        this.megaMemory = kernel.memory || kernel.systems?.memory;

        // Local cache/index
        this.cache = new Map(); // key -> { value, timestamp, source, tags }
        this.index = new Map(); // tag -> Set(keys)

        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * Store a memory artifact
     */
    async store(key, value, options = {}) {
        const { source = 'local', tags = [], ttl, metadata = {} } = options;

        const record = {
            key,
            value,
            timestamp: Date.now(),
            source,
            tags,
            metadata,
            ttl: ttl ? Date.now() + ttl : null
        };

        // Write to local cache
        this.cache.set(key, record);
        this._indexTags(key, tags);

        // Persist to disk
        await this._persist(key, record);

        // Also write to backends
        const backends = [];

        if (this.scribe && typeof this.scribe.witness === 'function') {
            backends.push(this.scribe.witness({ key, value, source, tags, metadata }).catch(e => console.warn('[MemorySubstrate] Scribe write failed:', e.message)));
        }

        if (this.megaMemory && typeof this.megaMemory.store === 'function') {
            backends.push(this.megaMemory.store(key, value, { tags, source }).catch(e => console.warn('[MemorySubstrate] MegaMemory write failed:', e.message)));
        }

        if (this.knowledgeGraph && typeof this.knowledgeGraph.addNode === 'function') {
            backends.push(this.knowledgeGraph.addNode(key, { type: 'memory', value, tags }).catch(e => console.warn('[MemorySubstrate] KnowledgeGraph write failed:', e.message)));
        }

        await Promise.allSettled(backends);

        return { success: true, key, storedAt: record.timestamp };
    }

    /**
     * Retrieve a memory by key
     */
    async retrieve(key, options = {}) {
        const { useCache = true } = options;

        // Check cache first
        if (useCache && this.cache.has(key)) {
            const record = this.cache.get(key);
            if (!record.ttl || record.ttl > Date.now()) {
                return { found: true, value: record.value, source: record.source, timestamp: record.timestamp };
            } else {
                // Expired
                this.cache.delete(key);
            }
        }

        // Try backends
        if (this.megaMemory && typeof this.megaMemory.retrieve === 'function') {
            try {
                const result = await this.megaMemory.retrieve(key);
                if (result?.found) {
                    return { found: true, ...result, source: 'megaMemory' };
                }
            } catch (e) {
                console.warn('[MemorySubstrate] MegaMemory retrieve failed:', e.message);
            }
        }

        // Try disk
        const diskRecord = await this._loadFromDisk(key);
        if (diskRecord) {
            this.cache.set(key, diskRecord);
            return { found: true, value: diskRecord.value, source: 'disk', timestamp: diskRecord.timestamp };
        }

        return { found: false, key };
    }

    /**
     * Associate two memories (bidirectional link)
     */
    async associate(key1, key2, relationship = 'related', metadata = {}) {
        // Store association in both directions
        await this.store(`assoc:${key1}:${key2}`, { target: key2, relationship, metadata }, { tags: ['association', key1] });
        await this.store(`assoc:${key2}:${key1}`, { target: key1, relationship, metadata }, { tags: ['association', key2] });

        // Also add to knowledge graph if available
        if (this.knowledgeGraph && typeof this.knowledgeGraph.addEdge === 'function') {
            await this.knowledgeGraph.addEdge(key1, key2, { type: relationship, ...metadata }).catch(() => {});
        }

        return { success: true, key1, key2, relationship };
    }

    /**
     * Synthesize: combine multiple memories into new insight
     */
    async synthesize(keys, query, options = {}) {
        const { maxTokens = 50000 } = options;

        // Retrieve all memories
        const memories = [];
        for (const key of keys) {
            const result = await this.retrieve(key);
            if (result.found) {
                memories.push({ key, ...result });
            }
        }

        if (!memories.length) {
            return { success: false, error: 'No memories found' };
        }

        // Use brain to synthesize
        const brain = this.kernel.brain || this.kernel.systems?.brain;
        if (brain && typeof brain.think === 'function') {
            const prompt = `Synthesize these memories into a new insight:

QUERY: ${query}

MEMORIES:
${memories.map(m => `=== ${m.key} (${m.source}, ${new Date(m.timestamp).toISOString()}) ===\n${JSON.stringify(m.value, null, 2)}`).join('\n\n')}

Return a structured synthesis with: insight, confidence, supportingKeys, newQuestions.`;

            const response = await brain.think(prompt, '', true);
            const synthesis = response?.result || response || '';

            // Store synthesis as new memory
            const synthesisKey = `synthesis:${crypto.randomBytes(8).toString('hex')}`;
            await this.store(synthesisKey, { query, insight: synthesis, sourceKeys: keys }, { tags: ['synthesis'], metadata: { confidence: 0.8 } });

            return { success: true, synthesis, synthesisKey, supportingKeys: keys };
        }

        return { success: false, error: 'Brain not available for synthesis' };
    }

    /**
     * Forget: remove a memory (soft delete with tombstone)
     */
    async forget(key, reason = '') {
        // Mark as forgotten in cache
        if (this.cache.has(key)) {
            const record = this.cache.get(key);
            record.forgotten = true;
            record.forgottenAt = Date.now();
            record.forgottenReason = reason;
        }

        // Write tombstone to disk
        await this._persist(key, { ...this.cache.get(key), forgotten: true, forgottenAt: Date.now(), forgottenReason: reason });

        // Notify backends
        if (this.megaMemory && typeof this.megaMemory.forget === 'function') {
            await this.megaMemory.forget(key).catch(() => {});
        }

        return { success: true, key, reason };
    }

    /**
     * Search memories by tags or query
     */
    async search(options = {}) {
        const { tags = [], query = '', limit = 50, source } = options;

        let candidates = new Set();

        // By tags
        if (tags.length) {
            for (const tag of tags) {
                const taggedKeys = this.index.get(tag) || new Set();
                for (const key of taggedKeys) candidates.add(key);
            }
        } else {
            // All keys
            for (const key of this.cache.keys()) candidates.add(key);
        }

        // Filter by source
        if (source) {
            for (const key of Array.from(candidates)) {
                const record = this.cache.get(key);
                if (record && record.source !== source) candidates.delete(key);
            }
        }

        // Filter by query (simple text match)
        if (query) {
            const lowerQuery = query.toLowerCase();
            for (const key of Array.from(candidates)) {
                const record = this.cache.get(key);
                if (record && !JSON.stringify(record.value).toLowerCase().includes(lowerQuery)) {
                    candidates.delete(key);
                }
            }
        }

        // Return limited results
        const results = [];
        for (const key of Array.from(candidates).slice(0, limit)) {
            const record = this.cache.get(key);
            if (record && !record.forgotten) {
                results.push({ key, value: record.value, timestamp: record.timestamp, source: record.source, tags: record.tags });
            }
        }

        return { results, count: results.length };
    }

    /**
     * Get memory statistics
     */
    getStats() {
        let bySource = {};
        let byTag = {};
        let forgotten = 0;

        for (const [key, record] of this.cache) {
            if (record.forgotten) forgotten++;
            else {
                bySource[record.source] = (bySource[record.source] || 0) + 1;
                for (const tag of record.tags || []) {
                    byTag[tag] = (byTag[tag] || 0) + 1;
                }
            }
        }

        return {
            totalCached: this.cache.size,
            active: this.cache.size - forgotten,
            forgotten,
            bySource,
            topTags: Object.entries(byTag).sort((a, b) => b[1] - a[1]).slice(0, 20)
        };
    }

    _indexTags(key, tags) {
        for (const tag of tags) {
            if (!this.index.has(tag)) this.index.set(tag, new Set());
            this.index.get(tag).add(key);
        }
    }

    async _persist(key, record) {
        const filePath = path.join(this.dataDir, `${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');
    }

    async _loadFromDisk(key) {
        const filePath = path.join(this.dataDir, `${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
        if (fs.existsSync(filePath)) {
            try {
                return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } catch (e) {
                return null;
            }
        }
        return null;
    }
}

module.exports = { MemorySubstrate };