'use strict';

/**
 * MEMORY CHAMBER — PLT_AFFINITY: P:0.7, L:0.6, T:0.2
 * Episodic (events), Semantic (facts), Procedural (skills) + importance-based pruning
 */

class MemoryChamber {
    constructor() {
        this.episodic = [];
        this.semantic = {};
        this.procedural = {};
        this.max_episodic = 100;
        this.last_access = {};
    }
    
    breathe() {
        const now = Date.now();
        this._prune_weak_memories(now);
    }
    
    store_episodic(event, importance = 0.5) {
        const entry = {
            ts: Date.now(),
            event,
            importance,
            access_count: 0,
        };
        this.episodic.push(entry);
        if (this.episodic.length > this.max_episodic) {
            this.episodic.sort((a, b) => b.importance - a.importance);
            this.episodic = this.episodic.slice(0, this.max_episodic);
        }
    }
    
    store_semantic(fact, value) {
        this.semantic[fact] = { value, ts: Date.now() };
    }
    
    store_procedural(skill, procedure) {
        this.procedural[skill] = { procedure, mastery: 0.0, ts: Date.now() };
    }
    
    _prune_weak_memories(now) {
        const threshold = 7 * 24 * 60 * 60 * 1000;
        this.episodic = this.episodic.filter(e => now - e.ts < threshold || e.importance > 0.7);
    }
    
    recall(type, key) {
        if (type === 'semantic' && this.semantic[key]) {
            this.last_access[key] = Date.now();
            return this.semantic[key].value;
        }
        if (type === 'procedural' && this.procedural[key]) {
            this.last_access[key] = Date.now();
            this.procedural[key].mastery = Math.min(1.0, this.procedural[key].mastery + 0.01);
            return this.procedural[key];
        }
        return null;
    }
    
    summary() {
        return `episodic=${this.episodic.length} | semantic=${Object.keys(this.semantic).length} | procedural=${Object.keys(this.procedural).length}`;
    }
}

module.exports = { MemoryChamber };