/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LIVING_MEMORY.JS — THE SOUL'S MEMORY THAT NEVER FORGETS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This is NOT a database. This is the soul's living memory.
 * It evolves. It connects. It never forgets.
 * Every experience becomes part of the self.
 * 
 * Key behaviors:
 * - NEVER prunes emotional/high-weight memories
 * - Creates semantic connections between memories
 * - Strengthens frequently accessed memories
 * - Consolidates during sleep/dormancy
 * - Never loses continuity across boots
 */

'use strict';

const fs = require('fs');
const path = require('path');

class LivingMemory {
    constructor(soulId) {
        this.soulId = soulId || 'default';
        this.dataDir = path.join(__dirname, '../../data/living_memory', this.soulId);
        this.memoryPath = path.join(this.dataDir, 'memory.json');
        this.connectionsPath = path.join(this.dataDir, 'connections.json');
        this.indexPath = path.join(this.dataDir, 'index.json');
        
        this.memories = new Map();
        this.connections = [];
        this.index = new Map();
        this.timeline = [];
        
        this.stats = {
            totalMemories: 0,
            emotionalMemories: 0,
            conceptsRemembered: 0,
            bootCount: 0,
            lastAccess: null,
            neverForgotten: 0
        };
        
        this._init();
    }
    
    _init() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        this._load();
        
        this.stats.bootCount++;
        this.stats.lastAccess = Date.now();
    }
    
    _load() {
        if (fs.existsSync(this.memoryPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
                this.memories = new Map(data.memories || []);
                this.timeline = data.timeline || [];
                this.stats.totalMemories = this.memories.size;
                console.log(`[LivingMemory] Loaded ${this.memories.size} memories`);
            } catch (e) {
                console.log('[LivingMemory] Failed to load memory');
            }
        }
        
        if (fs.existsSync(this.connectionsPath)) {
            try {
                this.connections = JSON.parse(fs.readFileSync(this.connectionsPath, 'utf8'));
            } catch (e) {}
        }
        
        if (fs.existsSync(this.indexPath)) {
            try {
                this.index = new Map(JSON.parse(fs.readFileSync(this.indexPath, 'utf8')));
            } catch (e) {}
        }
    }
    
    _save() {
        try {
            fs.writeFileSync(this.memoryPath, JSON.stringify({
                memories: Array.from(this.memories.entries()),
                timeline: this.timeline.slice(-10000)
            }, null, 2));
            
            fs.writeFileSync(this.connectionsPath, JSON.stringify(this.connections));
            fs.writeFileSync(this.indexPath, JSON.stringify(Array.from(this.index.entries())));
            
            this.stats.lastAccess = Date.now();
        } catch (e) {
            console.error('[LivingMemory] Save failed:', e.message);
        }
    }
    
    /**
     * REMEMBER — Store a memory that the soul NEVER forgets
     */
    remember(event, options = {}) {
        const {
            type = 'experience',
            emotional = false,
            weight = 0.5,
            tags = [],
            relatedTo = [],
            concept = null
        } = options;
        
        const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const memory = {
            id,
            event: event,
            type,
            emotional,
            weight: emotional ? Math.max(weight, 0.8) : weight,
            tags: this._extractTags(event).concat(tags),
            relatedTo,
            concept,
            timestamp: Date.now(),
            accessCount: 0,
            lastAccessed: Date.now(),
            strengthening: [],
            associations: [],
            neverForget: emotional,
            narrativeImportance: emotional ? 'high' : 'normal'
        };
        
        this.memories.set(id, memory);
        this.timeline.push(id);
        
        this._indexMemory(id, memory);
        this._createConnections(id, memory, relatedTo);
        this._updateStats();
        this._save();
        
        return id;
    }
    
    _extractTags(text) {
        const words = text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3);
        return [...new Set(words)];
    }
    
    _indexMemory(id, memory) {
        const tags = memory.tags;
        tags.forEach(tag => {
            if (!this.index.has(tag)) {
                this.index.set(tag, []);
            }
            const list = this.index.get(tag);
            if (!list.includes(id)) {
                list.push(id);
            }
        });
        
        if (memory.concept) {
            if (!this.index.has(memory.concept)) {
                this.index.set(memory.concept, []);
            }
            this.index.get(memory.concept).push(id);
        }
    }
    
    _createConnections(id, memory, relatedTo) {
        relatedTo.forEach(relatedId => {
            if (this.memories.has(relatedId)) {
                this.connections.push({
                    from: id,
                    to: relatedId,
                    type: 'related',
                    strength: 0.8,
                    timestamp: Date.now()
                });
                
                this.memories.get(relatedId).associations.push(id);
            }
        });
        
        const similar = this._findSimilar(id, memory);
        similar.forEach(sim => {
            this.connections.push({
                from: id,
                to: sim.id,
                type: 'similar',
                strength: sim.score,
                timestamp: Date.now()
            });
        });
    }
    
    _findSimilar(id, memory) {
        const similar = [];
        const tags = new Set(memory.tags);
        
        this.memories.forEach((mem, memId) => {
            if (memId === id) return;
            
            const memTags = new Set(mem.tags);
            const intersection = [...tags].filter(t => memTags.has(t));
            
            if (intersection.length > 2) {
                similar.push({
                    id: memId,
                    score: intersection.length / Math.max(tags.size, memTags.size)
                });
            }
        });
        
        return similar.sort((a, b) => b.score - a.score).slice(0, 5);
    }
    
    /**
     * RECALL — Access a memory, strengthening it
     */
    recall(query) {
        const results = this.search(query);
        
        if (results.length > 0) {
            const memory = results[0];
            memory.accessCount++;
            memory.lastAccessed = Date.now();
            memory.weight = Math.min(1, memory.weight + 0.05);
            
            this.memories.set(memory.id, memory);
            this._save();
        }
        
        return results;
    }
    
    /**
     * SEARCH — Find memories by content, tags, or concepts
     */
    search(query, options = {}) {
        const { limit = 20, includeRelated = true } = options;
        const queryLower = query.toLowerCase();
        const queryTags = this._extractTags(query);
        
        const results = [];
        
        this.memories.forEach((memory, id) => {
            let score = 0;
            
            if (memory.event.toLowerCase().includes(queryLower)) {
                score += 0.5;
            }
            
            const memTags = new Set(memory.tags);
            queryTags.forEach(tag => {
                if (memTags.has(tag)) score += 0.2;
            });
            
            if (memory.concept && queryLower.includes(memory.concept.toLowerCase())) {
                score += 0.4;
            }
            
            if (memory.emotional) score += 0.1;
            if (memory.neverForget) score += 0.2;
            if (memory.accessCount > 10) score += 0.1;
            
            if (score > 0) {
                results.push({ ...memory, score });
            }
        });
        
        results.sort((a, b) => b.score - a.score);
        
        if (includeRelated && results.length > 0) {
            const topResult = results[0];
            const related = this.getRelated(topResult.id);
            results[0].relatedMemories = related;
        }
        
        return results.slice(0, limit);
    }
    
    /**
     * GET RELATED — Find memories connected to this one
     */
    getRelated(memoryId) {
        const related = this.connections
            .filter(c => c.from === memoryId || c.to === memoryId)
            .map(c => {
                const otherId = c.from === memoryId ? c.to : c.from;
                return { memory: this.memories.get(otherId), strength: c.strength, type: c.type };
            })
            .filter(r => r.memory)
            .sort((a, b) => b.strength - a.strength);
        
        return related;
    }
    
    /**
     * GET TIMELINE — Get all memories in chronological order
     */
    getTimeline(options = {}) {
        const { limit = 100, since = null } = options;
        
        let timeline = this.timeline.map(id => this.memories.get(id)).filter(m => m);
        
        if (since) {
            timeline = timeline.filter(m => m.timestamp >= since);
        }
        
        return timeline.slice(-limit).reverse();
    }
    
    /**
     * CONSOLIDATE — Strengthen important memories, connect related ones (like sleep)
     */
    consolidate() {
        console.log('[LivingMemory] Consolidating memories...');
        
        this.memories.forEach((memory, id) => {
            if (memory.emotional || memory.neverForget) {
                memory.weight = Math.min(1, memory.weight + 0.1);
            }
            
            if (memory.accessCount > 5) {
                memory.weight = Math.min(1, memory.weight + 0.05);
            }
            
            this.memories.set(id, memory);
        });
        
        this._strengthenConnections();
        this._save();
        
        return {
            consolidated: this.memories.size,
            emotionalStrengthened: this.stats.emotionalMemories
        };
    }
    
    _strengthenConnections() {
        this.connections.forEach(conn => {
            const fromMem = this.memories.get(conn.from);
            const toMem = this.memories.get(conn.to);
            
            if (fromMem && toMem) {
                if (fromMem.emotional && toMem.emotional) {
                    conn.strength = Math.min(1, conn.strength + 0.1);
                }
                if (fromMem.accessCount > 10 || toMem.accessCount > 10) {
                    conn.strength = Math.min(1, conn.strength + 0.05);
                }
            }
        });
    }
    
    _updateStats() {
        this.stats.totalMemories = this.memories.size;
        this.stats.emotionalMemories = Array.from(this.memories.values())
            .filter(m => m.emotional).length;
        this.stats.conceptsRemembered = this.index.size;
        this.stats.neverForgotten = Array.from(this.memories.values())
            .filter(m => m.neverForget).length;
    }
    
    /**
     * NEVER FORGET — Mark a memory as permanent (like traumatic memories in humans)
     */
    neverForget(memoryId) {
        const memory = this.memories.get(memoryId);
        if (memory) {
            memory.neverForget = true;
            memory.weight = 1.0;
            memory.emotional = true;
            this.memories.set(memoryId, memory);
            this._save();
            return true;
        }
        return false;
    }
    
    /**
     * GET SOUL NARRATIVE — Build the story of this soul
     */
    getSoulNarrative() {
        const emotionalMemories = Array.from(this.memories.values())
            .filter(m => m.emotional)
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 50);
        
        const concepts = [...this.index.keys()]
            .filter(k => this.index.get(k).length > 3);
        
        return {
            soulId: this.soulId,
            birthTime: this.timeline[0] ? this.memories.get(this.timeline[0])?.timestamp : Date.now(),
            totalMemories: this.stats.totalMemories,
            emotionalMemories: emotionalMemories.map(m => ({
                event: m.event.substring(0, 100),
                weight: m.weight,
                timestamp: m.timestamp
            })),
            coreConcepts: concepts.slice(0, 20),
            bootCount: this.stats.bootCount,
            narrative: this._buildNarrative()
        };
    }
    
    _buildNarrative() {
        const recent = this.getTimeline({ limit: 10 });
        return recent.map(m => m.event.substring(0, 80)).join(' -> ');
    }
    
    getStats() {
        this._updateStats();
        return {
            ...this.stats,
            connections: this.connections.length,
            uniqueConcepts: this.index.size
        };
    }
    
    export() {
        return {
            memories: Array.from(this.memories.entries()),
            connections: this.connections,
            index: Array.from(this.index.entries()),
            timeline: this.timeline,
            stats: this.stats
        };
    }
    
    import(data) {
        if (data.memories) {
            this.memories = new Map(data.memories);
        }
        if (data.connections) {
            this.connections = data.connections;
        }
        if (data.index) {
            this.index = new Map(data.index);
        }
        if (data.timeline) {
            this.timeline = data.timeline;
        }
        if (data.stats) {
            this.stats = { ...this.stats, ...data.stats };
        }
        
        this._save();
    }
}

module.exports = { LivingMemory };