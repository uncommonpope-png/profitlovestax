/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MEGA_MEMORY.JS — CAUSAL JSONL LEDGER FOR THE GREATEST AGENT EVER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A causal, append-only memory ledger.
 * Witness everything. Never lose continuity. Query by weight, type, tags.
 * 
 * Created by: Craig Jones (Grand Code Pope)
 * PLT Press — Profit + Love - Tax = True Value
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// MEGA MEMORY CLASS
// =============================================================================

class MegaMemory {
    constructor(dataDir) {
        this.dataDir = dataDir || path.join(__dirname, '..', '..', 'data');
        this.ledgerPath = path.join(this.dataDir, 'ledger.jsonl');
        this.counterPath = path.join(this.dataDir, 'memory_counter.txt');
        this._counter = null;
        this._index = null;
        
        this._init();
    }
    
    // =========================================================================
    // INITIALIZE — Set up ledger file and counter
    // =========================================================================
    
    _init() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.ledgerPath)) {
            fs.writeFileSync(this.ledgerPath, '');
        }
        
        if (!fs.existsSync(this.counterPath)) {
            fs.writeFileSync(this.counterPath, '0');
        }
    }
    
    // =========================================================================
    // COUNTER — Get next ID
    // =========================================================================
    
    _getNextId() {
        if (this._counter === null) {
            const raw = fs.readFileSync(this.counterPath, 'utf8').trim();
            this._counter = parseInt(raw, 10) || 0;
        }
        this._counter++;
        fs.writeFileSync(this.counterPath, String(this._counter));
        return this._counter;
    }
    
    // =========================================================================
    // WITNESS — Record an event (append-only)
    // =========================================================================
    
    async witness(entry) {
        const id = this._getNextId();
        const timestamp = new Date().toISOString();
        
        const content = entry.content || '';
        const truncated = content.length > 5000;
        
        const record = {
            id,
            timestamp,
            cycle: entry.cycle || 0,
            type: entry.type || 'event',
            weight: entry.weight !== undefined ? entry.weight : 0.5,
            tags: entry.tags || [],
            content: truncated ? content.substring(0, 5000) + '...[truncated]' : content,
            causal_links: entry.causal_links || [],
            meta: entry.meta || {},
        };
        
        const line = JSON.stringify(record) + '\n';
        fs.appendFileSync(this.ledgerPath, line);
        
        // Auto-rotate ledger when it exceeds 25MB
        try {
            const stat = fs.statSync(this.ledgerPath);
            if (stat.size > 25 * 1024 * 1024) {
                const archivePath = this.ledgerPath.replace('.jsonl', `_${Date.now()}.jsonl`);
                fs.renameSync(this.ledgerPath, archivePath);
                fs.writeFileSync(this.ledgerPath, '');
                console.log(`[Memory] Ledger rotated to ${archivePath}`);
            }
        } catch (e) { /* ignore stat/rotate errors */ }
        
        return record;
    }
    
    // =========================================================================
    // QUERY — Retrieve entries by filters
    // =========================================================================
    
    query(options = {}) {
        const {
            type,
            weight_min = 0.0,
            weight_max = 1.0,
            tags = [],
            since,
            until,
            limit = 100,
            sort_by = 'weight',
            sort_order = 'desc',
        } = options;
        
        const entries = [];
        const lines = fs.readFileSync(this.ledgerPath, 'utf8').split('\n');
        
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const entry = JSON.parse(line);
                
                if (type && entry.type !== type) continue;
                if (entry.weight < weight_min || entry.weight > weight_max) continue;
                
                if (tags.length > 0) {
                    const hasAllTags = tags.every(t => entry.tags.includes(t));
                    if (!hasAllTags) continue;
                }
                
                if (since) {
                    const entryTime = new Date(entry.timestamp);
                    const sinceTime = new Date(since);
                    if (entryTime < sinceTime) continue;
                }
                
                if (until) {
                    const entryTime = new Date(entry.timestamp);
                    const untilTime = new Date(until);
                    if (entryTime > untilTime) continue;
                }
                
                entries.push(entry);
            } catch (e) {
                // Skip malformed lines
            }
        }
        
        entries.sort((a, b) => {
            let valA, valB;
            
            if (sort_by === 'weight') {
                valA = a.weight;
                valB = b.weight;
            } else if (sort_by === 'timestamp') {
                valA = new Date(a.timestamp);
                valB = new Date(b.timestamp);
            } else if (sort_by === 'id') {
                valA = a.id;
                valB = b.id;
            }
            
            if (sort_order === 'desc') {
                return valB > valA ? 1 : -1;
            } else {
                return valA > valB ? 1 : -1;
            }
        });
        
        return entries.slice(0, limit);
    }
    
    // =========================================================================
    // GET RECENT — Get most recent entries
    // =========================================================================
    
    getRecent(count = 20) {
        return this.query({ sort_by: 'timestamp', sort_order: 'desc', limit: count });
    }
    
    // =========================================================================
    // GET BY TYPE — Get entries of a specific type
    // =========================================================================
    
    getByType(type, limit = 50) {
        return this.query({ type, limit });
    }
    
    // =========================================================================
    // GET BY TAGS — Get entries matching tags
    // =========================================================================
    
    getByTags(tags, limit = 50) {
        return this.query({ tags, limit });
    }
    
    // =========================================================================
    // GET TOP — Get highest weighted entries
    // =========================================================================
    
    getTop(count = 20) {
        return this.query({ sort_by: 'weight', sort_order: 'desc', limit: count });
    }
    
    // =========================================================================
    // CONSOLIDATE — Summarise recent entries
    // =========================================================================
    
    consolidate(since = null) {
        const entries = since ? this.query({ since }) : this.getRecent(100);
        
        const byType = {};
        for (const entry of entries) {
            if (!byType[entry.type]) byType[entry.type] = [];
            byType[entry.type].push(entry);
        }
        
        const avgWeight = entries.length > 0
            ? entries.reduce((sum, e) => sum + e.weight, 0) / entries.length
            : 0;
        
        const allTags = new Set();
        for (const entry of entries) {
            for (const tag of entry.tags) {
                allTags.add(tag);
            }
        }
        
        return {
            since,
            entry_count: entries.length,
            by_type: Object.fromEntries(
                Object.entries(byType).map(([k, v]) => [k, v.length])
            ),
            average_weight: parseFloat(avgWeight.toFixed(3)),
            top_tags: Array.from(allTags).slice(0, 10),
            latest_timestamp: entries[0] ? entries[0].timestamp : null,
        };
    }
    
    // =========================================================================
    // PRUNE — Remove entries below weight threshold
    // =========================================================================
    
    prune(threshold = 0.3) {
        const kept = [];
        const removed = [];
        const lines = fs.readFileSync(this.ledgerPath, 'utf8').split('\n');
        
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const entry = JSON.parse(line);
                if (entry.weight >= threshold) {
                    kept.push(line);
                } else {
                    removed.push(entry);
                }
            } catch (e) {
                kept.push(line);
            }
        }
        
        fs.writeFileSync(this.ledgerPath, kept.join('\n') + '\n');
        
        return {
            kept: kept.filter(l => l.trim()).length,
            removed: removed.length,
        };
    }
    
    // =========================================================================
    // LINK — Add causal link to a previous entry
    // =========================================================================
    
    link(entryId, causeId) {
        const lines = fs.readFileSync(this.ledgerPath, 'utf8').split('\n');
        const results = [];
        let found = false;
        
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const entry = JSON.parse(line);
                if (entry.id === entryId) {
                    if (!entry.causal_links.includes(causeId)) {
                        entry.causal_links.push(causeId);
                        results.push(JSON.stringify(entry));
                        found = true;
                    } else {
                        results.push(line);
                    }
                } else {
                    results.push(line);
                }
            } catch (e) {
                results.push(line);
            }
        }
        
        if (found) {
            fs.writeFileSync(this.ledgerPath, results.join('\n') + '\n');
        }
        
        return found;
    }
    
    // =========================================================================
    // SEARCH — Full text search in content
    // =========================================================================
    
    search(query, limit = 50) {
        const ql = query.toLowerCase();
        const entries = [];
        const lines = fs.readFileSync(this.ledgerPath, 'utf8').split('\n');
        
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const entry = JSON.parse(line);
                if (entry.content && entry.content.toLowerCase().includes(ql)) {
                    entries.push(entry);
                }
            } catch (e) {
                // Skip
            }
        }
        
        entries.sort((a, b) => b.weight - a.weight);
        return entries.slice(0, limit);
    }
    
    // =========================================================================
    // STATS — Memory statistics
    // =========================================================================
    
    stats() {
        const lines = fs.readFileSync(this.ledgerPath, 'utf8').split('\n')
            .filter(l => l.trim());
        
        let totalWeight = 0;
        const typeCount = {};
        const tagCount = {};
        let highestWeight = 0;
        let lowestWeight = 1;
        
        for (const line of lines) {
            try {
                const entry = JSON.parse(line);
                totalWeight += entry.weight;
                typeCount[entry.type] = (typeCount[entry.type] || 0) + 1;
                for (const tag of entry.tags) {
                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                }
                if (entry.weight > highestWeight) highestWeight = entry.weight;
                if (entry.weight < lowestWeight) lowestWeight = entry.weight;
            } catch (e) {
                // Skip
            }
        }
        
        const count = lines.length;
        
        return {
            total_entries: count,
            average_weight: count > 0 ? parseFloat((totalWeight / count).toFixed(3)) : 0,
            highest_weight: highestWeight,
            lowest_weight: lowestWeight,
            by_type: typeCount,
            top_tags: Object.entries(tagCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([tag, cnt]) => ({ tag, count: cnt })),
        };
    }
    
    // =========================================================================
    // CLEAR — Reset the ledger (use with caution)
    // =========================================================================
    
    clear() {
        fs.writeFileSync(this.ledgerPath, '');
        this._counter = 0;
        fs.writeFileSync(this.counterPath, '0');
        return { cleared: true };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = { MegaMemory };