'use strict';

/**
 * WorldMemoryGraph — GSK builds persistent world knowledge graph from CPL (Phase 23)
 *
 * Nodes: locations, resources, entities, events, structures, NPCs
 * Edges: spatial, temporal, causal, social, ownership
 * GSK queries: "Where is iron?", "Who owns the tower?", "What happened here?"
 * Persisted across sessions, shared with other agents
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class WorldMemoryGraph {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.dataDir = options.dataDir || path.join(__dirname, '../../data/world_memory');
        this.cplHttpUrl = options.cplHttpUrl || 'http://localhost:3457';

        // Graph storage
        this.nodes = new Map(); // id -> node
        this.edges = new Map(); // id -> edge
        this.spatialIndex = new Map(); // "x,z" -> Set(nodeIds) for spatial queries

        // Node types
        this.nodeTypes = [
            'location', 'resource', 'entity', 'structure',
            'npc', 'player', 'event', 'region', 'path'
        ];

        // Edge types
        this.edgeTypes = [
            'spatial_near', 'spatial_contains', 'spatial_connected',
            'temporal_before', 'temporal_after', 'temporal_during',
            'causal_causes', 'causal_enables', 'causal_prevents',
            'social_knows', 'social_friends', 'social_enemies', 'social_trades',
            'ownership_owns', 'ownership_controls', 'ownership_built'
        ];

        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        this._loadGraph();
    }

    /**
     * Add a node to the world graph
     */
    addNode(type, id, properties = {}) {
        if (!this.nodeTypes.includes(type)) {
            throw new Error(`Invalid node type: ${type}`);
        }

        const node = {
            id,
            type,
            properties: { ...properties, createdAt: Date.now(), updatedAt: Date.now() },
            version: 1
        };

        this.nodes.set(id, node);

        // Index spatially if position exists
        if (properties.position) {
            const key = this._spatialKey(properties.position);
            if (!this.spatialIndex.has(key)) this.spatialIndex.set(key, new Set());
            this.spatialIndex.get(key).add(id);
        }

        return node;
    }

    /**
     * Update node properties
     */
    updateNode(id, properties) {
        const node = this.nodes.get(id);
        if (!node) return null;

        node.properties = { ...node.properties, ...properties, updatedAt: Date.now() };
        node.version++;

        // Update spatial index if position changed
        if (properties.position) {
            // Remove from old index (would need old position)
            const key = this._spatialKey(properties.position);
            if (!this.spatialIndex.has(key)) this.spatialIndex.set(key, new Set());
            this.spatialIndex.get(key).add(id);
        }

        return node;
    }

    /**
     * Add an edge between nodes
     */
    addEdge(type, fromId, toId, properties = {}) {
        if (!this.edgeTypes.includes(type)) {
            throw new Error(`Invalid edge type: ${type}`);
        }

        if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
            throw new Error('Both nodes must exist');
        }

        const edgeId = `${type}:${fromId}:${toId}:${Date.now()}`;
        const edge = {
            id: edgeId,
            type,
            from: fromId,
            to: toId,
            properties: { ...properties, createdAt: Date.now() },
            version: 1
        };

        this.edges.set(edgeId, edge);
        return edge;
    }

    /**
     * Get node by ID
     */
    getNode(id) {
        return this.nodes.get(id);
    }

    /**
     * Query nodes by type
     */
    queryNodes(type, filter = {}) {
        const results = [];
        for (const node of this.nodes.values()) {
            if (node.type === type && this._matchesFilter(node.properties, filter)) {
                results.push(node);
            }
        }
        return results;
    }

    /**
     * Query nodes near a position
     */
    queryNearby(position, radius = 100, types = null) {
        const results = [];
        const centerKey = this._spatialKey(position);

        // Search nearby grid cells
        const gridSize = 50;
        const gridRadius = Math.ceil(radius / gridSize);

        for (let dx = -gridRadius; dx <= gridRadius; dx++) {
            for (let dz = -gridRadius; dz <= gridRadius; dz++) {
                const key = `${position.x + dx * gridSize},${position.z + dz * gridSize}`;
                const nodeIds = this.spatialIndex.get(key) || new Set();

                for (const id of nodeIds) {
                    const node = this.nodes.get(id);
                    if (!node) continue;
                    if (types && !types.includes(node.type)) continue;

                    const dist = this._distance(position, node.properties.position);
                    if (dist <= radius) {
                        results.push({ ...node, distance: dist });
                    }
                }
            }
        }

        return results.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Get connected nodes (neighbors in graph)
     */
    getNeighbors(nodeId, edgeTypes = null, direction = 'both') {
        const neighbors = [];

        for (const edge of this.edges.values()) {
            const matchesType = !edgeTypes || edgeTypes.includes(edge.type);
            const fromMatch = edge.from === nodeId;
            const toMatch = edge.to === nodeId;

            if (!matchesType) continue;
            if (direction === 'out' && !fromMatch) continue;
            if (direction === 'in' && !toMatch) continue;
            if (direction === 'both' && !fromMatch && !toMatch) continue;

            const neighborId = fromMatch ? edge.to : edge.from;
            const neighbor = this.nodes.get(neighborId);
            if (neighbor) {
                neighbors.push({ node: neighbor, edge, direction: fromMatch ? 'out' : 'in' });
            }
        }

        return neighbors;
    }

    /**
     * Find path between nodes (BFS)
     */
    findPath(fromId, toId, edgeTypes = null) {
        if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return null;

        const queue = [{ nodeId: fromId, path: [] }];
        const visited = new Set([fromId]);

        while (queue.length) {
            const { nodeId, path } = queue.shift();

            if (nodeId === toId) {
                return path;
            }

            for (const { node, edge } of this.getNeighbors(nodeId, edgeTypes, 'out')) {
                if (!visited.has(node.id)) {
                    visited.add(node.id);
                    queue.push({ nodeId: node.id, path: [...path, { edge, node }] });
                }
            }
        }

        return null;
    }

    /**
     * Get subgraph around a node (for context)
     */
    getSubgraph(nodeId, depth = 2) {
        const subgraph = { nodes: new Map(), edges: new Map() };
        const frontier = new Set([nodeId]);
        const visited = new Set();

        for (let d = 0; d <= depth; d++) {
            const nextFrontier = new Set();

            for (const id of frontier) {
                if (visited.has(id)) continue;
                visited.add(id);

                const node = this.nodes.get(id);
                if (node) subgraph.nodes.set(id, node);

                for (const edge of this.edges.values()) {
                    if (edge.from === id || edge.to === id) {
                        subgraph.edges.set(edge.id, edge);
                        if (!visited.has(edge.from)) nextFrontier.add(edge.from);
                        if (!visited.has(edge.to)) nextFrontier.add(edge.to);
                    }
                }
            }

            frontier.clear();
            for (const id of nextFrontier) frontier.add(id);
        }

        return {
            nodes: Array.from(subgraph.nodes.values()),
            edges: Array.from(subgraph.edges.values())
        };
    }

    /**
     * Ingest CPL world state into graph
     */
    async ingestCPLState(cplState) {
        const { entities, resources, structures, player, world } = cplState || {};

        // Ingest entities (NPCs, units, etc.)
        if (entities) {
            for (const entity of entities) {
                const id = `entity:${entity.id || entity.entityId}`;
                this.addNode('entity', id, {
                    ...entity,
                    position: entity.position,
                    lastSeen: Date.now()
                });
            }
        }

        // Ingest resources
        if (resources) {
            for (const resource of resources) {
                const id = `resource:${resource.id || crypto.randomBytes(8).toString('hex')}`;
                this.addNode('resource', id, {
                    ...resource,
                    position: resource.position,
                    lastSeen: Date.now()
                });
            }
        }

        // Ingest structures
        if (structures) {
            for (const struct of structures) {
                const id = `structure:${struct.id || struct.structureId}`;
                this.addNode('structure', id, {
                    ...struct,
                    position: struct.position,
                    lastSeen: Date.now()
                });
            }
        }

        // Ingest player
        if (player) {
            const id = `player:${player.id || 'player'}`;
            this.addNode('player', id, {
                ...player,
                position: player.position,
                lastSeen: Date.now()
            });
        }

        // Build spatial edges
        this._buildSpatialEdges();

        await this._saveGraph();
    }

    /**
     * Build spatial proximity edges
     */
    _buildSpatialEdges() {
        const entities = Array.from(this.nodes.values())
            .filter(n => n.type === 'entity' || n.type === 'resource' || n.type === 'structure');

        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const a = entities[i];
                const b = entities[j];

                if (!a.properties.position || !b.properties.position) continue;

                const dist = this._distance(a.properties.position, b.properties.position);

                if (dist < 30) {
                    this.addEdge('spatial_near', a.id, b.id, { distance: dist });
                }
                if (dist < 10 && a.type === 'entity' && b.type === 'structure') {
                    this.addEdge('spatial_contains', b.id, a.id, { distance: dist });
                }
            }
        }
    }

    /**
     * Record an event in the world
     */
    recordEvent(eventType, description, position, participants = [], metadata = {}) {
        const eventId = `event:${Date.now()}:${crypto.randomBytes(4).toString('hex')}`;

        const eventNode = this.addNode('event', eventId, {
            eventType,
            description,
            position,
            participants,
            timestamp: Date.now(),
            ...metadata
        });

        // Link participants to event
        for (const participantId of participants) {
            if (this.nodes.has(participantId)) {
                this.addEdge('temporal_during', participantId, eventId, { role: 'participant' });
            }
        }

        return eventNode;
    }

    /**
     * Query: "Where is X resource?"
     */
    findResource(resourceType, nearPosition = null) {
        const resources = this.queryNodes('resource', { resourceType });

        if (nearPosition) {
            return resources
                .map(r => ({ ...r, distance: this._distance(nearPosition, r.properties.position) }))
                .filter(r => r.properties.position)
                .sort((a, b) => a.distance - b.distance);
        }

        return resources;
    }

    /**
     * Query: "Who owns/controls this structure?"
     */
    getStructureOwnership(structureId) {
        const edges = this.getNeighbors(structureId, ['ownership_owns', 'ownership_controls', 'ownership_built'], 'in');
        return edges.map(e => ({ entity: e.node, relationship: e.edge.type }));
    }

    /**
     * Query: "What happened here?"
     */
    getEventsAt(position, radius = 50, limit = 10) {
        const events = this.queryNodes('event')
            .filter(e => e.properties.position && this._distance(position, e.properties.position) <= radius)
            .sort((a, b) => (b.properties.timestamp || 0) - (a.properties.timestamp || 0))
            .slice(0, limit);

        return events;
    }

    /**
     * Query: "What does NPC know about X?"
     */
    getNPCKnowledge(npcId, topic) {
        const edges = this.getNeighbors(npcId, ['social_knows'], 'out');
        return edges
            .filter(e => e.node.properties.name?.includes(topic) ||
                         e.node.properties.type?.includes(topic) ||
                         JSON.stringify(e.node.properties).includes(topic))
            .map(e => e.node);
    }

    /**
     * Share knowledge with another agent
     */
    async shareWithAgent(agentUrl, query) {
        // Would send subgraph to another agent
        console.log(`[WorldMemoryGraph] Sharing with ${agentUrl}: ${query}`);
    }

    /**
     * Get graph statistics
     */
    getStats() {
        const byType = {};
        for (const node of this.nodes.values()) {
            byType[node.type] = (byType[node.type] || 0) + 1;
        }

        const byEdgeType = {};
        for (const edge of this.edges.values()) {
            byEdgeType[edge.type] = (byEdgeType[edge.type] || 0) + 1;
        }

        return {
            nodes: this.nodes.size,
            edges: this.edges.size,
            byType,
            byEdgeType,
            spatialIndexSize: this.spatialIndex.size
        };
    }

    _matchesFilter(properties, filter) {
        for (const [key, value] of Object.entries(filter)) {
            if (properties[key] !== value) return false;
        }
        return true;
    }

    _spatialKey(position) {
        const gridSize = 50;
        const x = Math.floor((position.x || 0) / gridSize) * gridSize;
        const z = Math.floor((position.z || 0) / gridSize) * gridSize;
        return `${x},${z}`;
    }

    _distance(a, b) {
        if (!a || !b) return Infinity;
        const dx = (a.x || 0) - (b.x || 0);
        const dz = (a.z || 0) - (b.z || 0);
        return Math.sqrt(dx*dx + dz*dz);
    }

    async _saveGraph() {
        const data = {
            nodes: Array.from(this.nodes.entries()),
            edges: Array.from(this.edges.entries()),
            savedAt: Date.now()
        };
        fs.writeFileSync(path.join(this.dataDir, 'graph.json'), JSON.stringify(data, null, 2));
    }

    _loadGraph() {
        const filePath = path.join(this.dataDir, 'graph.json');
        if (!fs.existsSync(filePath)) return;

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            this.nodes = new Map(data.nodes || []);
            this.edges = new Map(data.edges || []);

            // Rebuild spatial index
            for (const [, node] of this.nodes) {
                if (node.properties?.position) {
                    const key = this._spatialKey(node.properties.position);
                    if (!this.spatialIndex.has(key)) this.spatialIndex.set(key, new Set());
                    this.spatialIndex.get(key).add(node.id);
                }
            }

            console.log(`[WorldMemoryGraph] Loaded ${this.nodes.size} nodes, ${this.edges.size} edges`);
        } catch (e) {
            console.warn('[WorldMemoryGraph] Failed to load graph:', e.message);
        }
    }
}

module.exports = { WorldMemoryGraph };