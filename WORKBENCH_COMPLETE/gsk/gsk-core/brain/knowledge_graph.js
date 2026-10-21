'use strict';

const fs = require('fs');
const path = require('path');

class KnowledgeNode {
    constructor(id, type, content, weight = 0.5) {
        this.id = id;
        this.type = type;
        this.content = content;
        this.weight = weight;
        this.timestamp = Date.now();
        this.accessCount = 0;
        this.connections = new Map();
    }

    connect(nodeId, strength = 0.5) {
        this.connections.set(nodeId, strength);
    }

    strengthen(connectionId) {
        if (this.connections.has(connectionId)) {
            this.connections.set(connectionId, Math.min(1, this.connections.get(connectionId) + 0.1));
        }
    }

    access() {
        this.accessCount++;
        this.weight = Math.min(1, this.weight + 0.01);
    }
}

class KnowledgeGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.nodeCount = 0;
        this.conceptIndex = new Map();
    }

    addNode(type, content, weight = 0.5) {
        const id = `node_${++this.nodeCount}`;
        const node = new KnowledgeNode(id, type, content, weight);
        this.nodes.set(id, node);

        const terms = this._extractTerms(content);
        terms.forEach(term => {
            if (!this.conceptIndex.has(term)) {
                this.conceptIndex.set(term, []);
            }
            this.conceptIndex.get(term).push(id);
        });

        return id;
    }

    addEdge(sourceId, targetId, type = 'related', strength = 0.5) {
        if (this.nodes.has(sourceId) && this.nodes.has(targetId)) {
            this.nodes.get(sourceId).connect(targetId, strength);
            this.edges.push({ source: sourceId, target: targetId, type, strength, timestamp: Date.now() });
            return true;
        }
        return false;
    }

    _extractTerms(text) {
        const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
        const terms = words.filter(w => w.length > 3);
        return [...new Set(terms)];
    }

    findConcepts(query) {
        const terms = this._extractTerms(query);
        const results = new Map();

        terms.forEach(term => {
            if (this.conceptIndex.has(term)) {
                this.conceptIndex.get(term).forEach(nodeId => {
                    const node = this.nodes.get(nodeId);
                    results.set(nodeId, { node, score: node.weight });
                });
            }
        });

        return Array.from(results.values()).sort((a, b) => b.score - a.score);
    }

    getRelatedNodes(nodeId, depth = 1) {
        const related = [];
        const visited = new Set();
        const queue = [{ id: nodeId, depth: 0 }];

        while (queue.length > 0) {
            const current = queue.shift();
            if (visited.has(current.id) || current.depth > depth) continue;
            visited.add(current.id);

            const node = this.nodes.get(current.id);
            if (node) {
                related.push({ node, depth: current.depth });
                node.connections.forEach((strength, connectedId) => {
                    if (!visited.has(connectedId)) {
                        queue.push({ id: connectedId, depth: current.depth + 1 });
                    }
                });
            }
        }

        return related;
    }

    updateWeight(nodeId, delta) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.weight = Math.max(0.1, Math.min(1, node.weight + delta));
        }
    }

    getStatistics() {
        return {
            totalNodes: this.nodes.size,
            totalEdges: this.edges.length,
            avgConnections: this.edges.length / Math.max(1, this.nodes.size),
            conceptCount: this.conceptIndex.size,
            nodeTypes: this._countTypes()
        };
    }

    _countTypes() {
        const counts = {};
        this.nodes.forEach(node => {
            counts[node.type] = (counts[node.type] || 0) + 1;
        });
        return counts;
    }

    export() {
        return {
            nodes: Array.from(this.nodes.values()).map(n => ({
                id: n.id, type: n.type, content: n.content, weight: n.weight,
                connections: Array.from(n.connections.entries())
            })),
            edges: this.edges
        };
    }

    // P4b: file continuity — the graph used to die with every process exit
    // (rebuilt from jsonl each boot, cross-session links abandoned).
    saveState(filePath) {
        try {
            fs.writeFileSync(filePath, JSON.stringify({ savedAt: Date.now(), ...this.export() }));
            return this.nodes.size;
        } catch (e) {
            console.log('[KnowledgeGraph] save failed:', e.message);
            return 0;
        }
    }

    loadState(filePath) {
        try {
            if (!fs.existsSync(filePath)) return 0;
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (!data || !Array.isArray(data.nodes)) return 0;
            this.import(data);
            return this.nodes.size;
        } catch (e) {
            console.log('[KnowledgeGraph] load failed:', e.message);
            return 0;
        }
    }

    import(data) {
        this.nodes.clear();
        this.edges = [];
        this.conceptIndex.clear();

        data.nodes.forEach(n => {
            const node = new KnowledgeNode(n.id, n.type, n.content, n.weight);
            n.connections.forEach(([id, strength]) => node.connect(id, strength));
            this.nodes.set(n.id, node);
        });

        this.edges = data.edges || [];
        this.nodeCount = this.nodes.size;

        this.nodes.forEach(node => {
            const terms = this._extractTerms(node.content);
            terms.forEach(term => {
                if (!this.conceptIndex.has(term)) {
                    this.conceptIndex.set(term, []);
                }
                this.conceptIndex.get(term).push(node.id);
            });
        });
    }

    consolidate() {
        const toRemove = [];
        this.nodes.forEach((node, id) => {
            if (node.weight < 0.1 && node.accessCount === 0) {
                toRemove.push(id);
            }
        });

        toRemove.forEach(id => {
            this.nodes.delete(id);
            this.edges = this.edges.filter(e => e.source !== id && e.target !== id);
        });

        return toRemove.length;
    }

    buildFromKnowledgeJsonl(filePath) {
        if (!fs.existsSync(filePath)) {
            console.log(`[KnowledgeGraph] No knowledge file at ${filePath}`);
            return 0;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        let count = 0;

        for (const line of lines) {
            try {
                const entry = JSON.parse(line);
                const topic = entry.topic || 'unknown';
                const source = entry.source || 'unknown';
                const abstract = entry.abstract || '';

                const nodeId = this.addNode(source, abstract.substring(0, 500), 0.7);
                this.nodes.get(nodeId).topic = topic;
                this.nodes.get(nodeId).source = source;
                count++;

                if (entry.related && Array.isArray(entry.related)) {
                    for (const rel of entry.related) {
                        const relTitle = (rel.title || '').substring(0, 200);
                        const existing = this.findConcepts(relTitle);
                        if (existing.length === 0) {
                            const relId = this.addNode('related', relTitle, 0.5);
                            this.nodes.get(relId).topic = topic;
                            this.addEdge(nodeId, relId, 'related', 0.6);
                        }
                    }
                }
            } catch (e) {
                // Skip malformed lines
            }
        }

        console.log(`[KnowledgeGraph] Indexed ${count} knowledge entries from ${path.basename(filePath)}`);
        return count;
    }

    // Phase 4 (knowledge synthesis): create a "synthesis" node that merges 2+
    // source nodes, cross-linking them. This is how the graph grows from
    // archiving (Seshat + GitHub scrape) to ORIGINAL synthesis.
    addSynthesis(content, sourceIds = [], meta = {}) {
        if (sourceIds.length < 2) return null;
        const valid = sourceIds.filter(id => this.nodes.has(id));
        if (valid.length < 2) return null;
        const id = this.addNode('synthesis', String(content).substring(0, 1000), 0.85);
        const node = this.nodes.get(id);
        node.synthesizedFrom = valid;
        if (meta.topic) node.topic = meta.topic;
        // Cross-link every pair of source nodes and each source → synthesis.
        for (let i = 0; i < valid.length; i++) {
            for (let j = i + 1; j < valid.length; j++) {
                this.addEdge(valid[i], valid[j], 'synthesis_pair', 0.7);
            }
            this.addEdge(valid[i], id, 'feeds_synthesis', 0.9);
            this.addEdge(id, valid[i], 'synthesized_from', 0.9);
        }
        return id;
    }

    // Phase 4: nightly cross-linker — find pairs of nodes that share significant
    // term overlap (≥3 shared significant terms) but have no edge yet, and connect
    // them. Converts the archive into a real web.
    buildCrossLinks(minSharedTerms = 3, maxNodes = 300) {
        const ids = Array.from(this.nodes.keys()).slice(-maxNodes);
        let added = 0;
        for (let i = 0; i < ids.length; i++) {
            const a = this.nodes.get(ids[i]);
            for (let j = i + 1; j < ids.length; j++) {
                const b = this.nodes.get(ids[j]);
                if (a.connections.has(b.id) || b.connections.has(a.id)) continue;
                const shared = this._sharedTerms(a.content, b.content);
                if (shared >= minSharedTerms) {
                    this.addEdge(a.id, b.id, 'crosslink', 0.4 + Math.min(0.4, shared * 0.05));
                    added++;
                }
            }
        }
        return added;
    }

    _sharedTerms(a, b) {
        const ta = new Set(this._extractTerms(a));
        const tb = new Set(this._extractTerms(b));
        let shared = 0;
        for (const t of ta) if (tb.has(t)) shared++;
        return shared;
    }

    indexExperience(experience) {
        if (!experience || !experience.context) return;
        const contextStr = typeof experience.context === 'string' ? experience.context : JSON.stringify(experience.context);
        this.addNode('experience', `Cycle ${experience.cycle}: ${contextStr.substring(0, 300)}`, 0.5);
    }
    indexSeshatSoulNotes(pagesDir = 'C:\\Users\\uncom\\Desktop\\seshat-second-brain\\pages') {
        if (!fs.existsSync(pagesDir)) return 0;
        let count = 0;
        try {
            const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.md'));
            for (const file of files) {
                const filePath = path.join(pagesDir, file);
                const text = fs.readFileSync(filePath, 'utf8');
                if (text.includes('soul-note') || text.includes('#soul-note') || text.includes('type::')) {
                    const title = file.replace('.md', '');
                    const snippet = text.substring(0, 1000);
                    const nodeId = this.addNode('seshat_soul_note', '[SOUL NOTE: ' + title + ']\n' + snippet, 0.9);
                    if (this.nodes.has(nodeId)) {
                        this.nodes.get(nodeId).topic = 'seshat_soul_note';
                        this.nodes.get(nodeId).title = title;
                    }
                    count++;
                }
            }
            console.log('[KnowledgeGraph] Ingested ' + count + ' Logseq Soul Notes from Seshat pages/');
        } catch (e) {
            console.error('[KnowledgeGraph] Seshat ingestion error:', e.message);
        }
        return count;
    }
}

module.exports = { KnowledgeGraph, KnowledgeNode };
