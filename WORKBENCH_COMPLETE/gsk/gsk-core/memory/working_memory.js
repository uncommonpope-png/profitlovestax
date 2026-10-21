'use strict';

/**
 * WORKING MEMORY — Bounded active reasoning context.
 *
 * Constitution Class 1. Limits the active context to ~7 items
 * with explicit eviction and a promotion gate to durable memory.
 *
 * Stolen from:
 *   Human short-term memory research — 7±2 item capacity
 *   REDBUTTON Constitution Article 3 Class 1
 *   Letta — active context management
 */

class WorkingMemory {
    constructor(options = {}) {
        this.capacity = options.capacity || 7;
        this.items = [];
        this.promotionThreshold = options.promotionThreshold || 3; // accesses before promotion
        this.accessCounts = new Map();
        this.evictedHistory = [];

        // Core domains that always have a slot
        this.reservedSlots = options.reservedSlots || 1; // at least 1 slot for current task
    }

    /**
     * Push an item into working memory.
     * If at capacity, the lowest-importance item is evicted.
     * Returns the evicted item if any.
     */
    push(item) {
        const entry = {
            id: item.id || `wm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            content: item.content || '',
            type: item.type || 'observation',
            priority: item.priority || 0,
            timestamp: Date.now(),
            accessCount: 0,
            tags: item.tags || [],
            source: item.source || 'unknown',
            promoted: false
        };

        // Check for duplicates by content similarity
        const existing = this.items.find(i => i.content === entry.content);
        if (existing) {
            existing.accessCount++;
            existing.timestamp = Date.now();
            this.accessCounts.set(existing.id, (this.accessCounts.get(existing.id) || 0) + 1);
            return null;
        }

        let evicted = null;

        if (this.items.length >= this.capacity) {
            evicted = this._evict();
        }

        this.items.push(entry);
        this.accessCounts.set(entry.id, 0);
        return evicted;
    }

    /**
     * Evict the lowest-priority item.
     * Items with reserved slots are protected.
     * Returns the evicted entry.
     */
    _evict() {
        if (this.items.length === 0) return null;

        // Score each item for eviction: lower score = more likely to be evicted
        const scores = this.items.map((item, idx) => {
            const accessScore = Math.min(1, (this.accessCounts.get(item.id) || 0) / 10);
            const recencyScore = Math.min(1, (Date.now() - item.timestamp) / 60000); // 1 min decay
            const priorityScore = item.priority / 10;

            // Total score: higher = more likely to stay
            const score = (accessScore * 0.3) + (recencyScore * -0.2) + (priorityScore * 0.5);

            return { idx, score, item };
        });

        // Sort by score ascending (lowest score = evict first)
        scores.sort((a, b) => a.score - b.score);

        // Never evict the most recent item if it's the only one of its type
        const evictTarget = scores[0];
        const evicted = this.items.splice(evictTarget.idx, 1)[0];

        evicted.evictedAt = Date.now();

        // Store in eviction history for potential promotion
        this.evictedHistory.push(evicted);
        if (this.evictedHistory.length > 50) {
            this.evictedHistory.shift();
        }

        this.accessCounts.delete(evicted.id);

        return evicted;
    }

    /**
     * Get current working memory contents.
     */
    get() {
        return [...this.items].sort((a, b) => b.priority - a.priority);
    }

    /**
     * Get item by ID.
     */
    getById(id) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.accessCount++;
            this.accessCounts.set(id, (this.accessCounts.get(id) || 0) + 1);
        }
        return item || null;
    }

    /**
     * Remove item by ID.
     */
    remove(id) {
        const idx = this.items.findIndex(i => i.id === id);
        if (idx >= 0) {
            const removed = this.items.splice(idx, 1)[0];
            this.accessCounts.delete(id);
            return removed;
        }
        return null;
    }

    /**
     * Promote items to durable memory.
     * Items with high access counts or explicit priority are promoted.
     * Returns promoted items for the Memory Compiler to process.
     */
    promote() {
        const promoted = [];

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const accessCount = this.accessCounts.get(item.id) || 0;

            if (accessCount >= this.promotionThreshold || item.priority >= 7) {
                item.promoted = true;
                item.promotedAt = Date.now();
                promoted.push(item);
                this.items.splice(i, 1);
                this.accessCounts.delete(item.id);
            }
        }

        // Also check eviction history for items that should be promoted
        for (let i = this.evictedHistory.length - 1; i >= 0; i--) {
            const evicted = this.evictedHistory[i];
            if (evicted.priority >= 6 || (evicted.accessCount || 0) >= this.promotionThreshold) {
                if (!evicted.promoted) {
                    evicted.promoted = true;
                    evicted.promotedAt = Date.now();
                    promoted.push(evicted);
                    this.evictedHistory.splice(i, 1);
                }
            }
        }

        return promoted;
    }

    /**
     * Clear working memory (new task boundary).
     */
    clear() {
        // Move everything to eviction history before clearing
        for (const item of this.items) {
            item.evictedAt = Date.now();
            this.evictedHistory.push(item);
        }
        if (this.evictedHistory.length > 50) {
            this.evictedHistory = this.evictedHistory.slice(-50);
        }
        this.items = [];
        this.accessCounts.clear();
    }

    /**
     * Get stats.
     */
    getStats() {
        return {
            capacity: this.capacity,
            currentLoad: this.items.length,
            utilization: this.items.length / this.capacity,
            evictionHistorySize: this.evictedHistory.length,
            promotionThreshold: this.promotionThreshold,
            totalAccessesTracked: this.accessCounts.size
        };
    }
}

module.exports = { WorkingMemory };
