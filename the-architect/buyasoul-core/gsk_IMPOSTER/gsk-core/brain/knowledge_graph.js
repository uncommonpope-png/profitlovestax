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

    indexExperience(experience) {
        if (!experience || !experience.context) return;
        const contextStr = typeof experience.context === 'string' ? experience.context : JSON.stringify(experience.context);
        this.addNode('experience', `Cycle ${experience.cycle}: ${contextStr.substring(0, 300)}`, 0.5);
    }
}

module.exports = { KnowledgeGraph, KnowledgeNode };